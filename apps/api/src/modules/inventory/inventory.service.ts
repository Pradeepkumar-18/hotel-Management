import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { TransactionService } from '../../common/database/transaction.service';
import { AuditService } from '../audit/audit.service';
import { RoomType, RoomTypeDocument, RoomTypeStatus } from '../hotels/schemas/room-type.schema';
import { NightInventory, NightInventoryDocument } from './schemas/night-inventory.schema';
import { InventoryAdjustmentDto, InventoryRangeDto } from './dto/inventory.dto';

const MAX_RANGE_DAYS = 366;

export interface InventoryCalendarResponse {
  roomTypeId: string;
  from: string;
  to: string;
  nights: Array<{
    id: string;
    stayDate: string;
    total: number;
    blocked: number;
    held: number;
    confirmed: number;
    version: number;
    available: number;
  }>;
  missingDates: string[];
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(NightInventory.name) private readonly inventoryModel: Model<NightInventoryDocument>,
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    private readonly audit: AuditService,
    private readonly transactions: TransactionService,
  ) {}

  async getCalendar(roomTypeId: string, range: InventoryRangeDto, actor: StaffPrincipal): Promise<InventoryCalendarResponse> {
    const roomType = await this.getRoomType(roomTypeId);
    assertHotelScope(actor, roomType.hotelId.toString());
    const dates = dateRange(range.from, range.to);
    const records = await this.inventoryModel
      .find({ roomTypeId: roomType._id, stayDate: { $gte: range.from, $lt: range.to } })
      .sort({ stayDate: 1 })
      .lean();
    const present = new Set(records.map((record) => record.stayDate));
    return {
      roomTypeId: roomType._id.toString(),
      from: range.from,
      to: range.to,
      nights: records.map((record) => ({
        id: record._id.toString(),
        stayDate: record.stayDate,
        total: record.total,
        blocked: record.blocked,
        held: record.held,
        confirmed: record.confirmed,
        version: record.version,
        available: record.total - record.blocked - record.held - record.confirmed,
      })),
      missingDates: dates.filter((date) => !present.has(date)),
    };
  }

  async initialize(roomTypeId: string, range: InventoryRangeDto, actor: StaffPrincipal) {
    const roomTypeObjectId = asObjectId(roomTypeId);
    const dates = dateRange(range.from, range.to);
    return this.transactions.executeInTransaction(async (session) => {
      const roomType = await this.getRoomType(roomTypeId, session);
      assertHotelScope(actor, roomType.hotelId.toString());
      if (roomType.status !== RoomTypeStatus.ACTIVE) {
        throw new ConflictException({ error: 'ROOM_TYPE_DISABLED', message: 'Enable the room type before initializing sellable inventory' });
      }

      const locked = await this.roomTypeModel.updateOne(
        { _id: roomTypeObjectId, version: roomType.version, status: RoomTypeStatus.ACTIVE },
        { $inc: { inventoryRevision: 1 } },
        { session },
      );
      if (locked.modifiedCount !== 1) throw versionConflict();

      const existing = await this.inventoryModel.find({ roomTypeId: roomTypeObjectId, stayDate: { $in: dates } }).select('stayDate').session(session).lean();
      const present = new Set(existing.map((item) => item.stayDate));
      const missing = dates.filter((date) => !present.has(date));
      if (missing.length > 0) {
        await this.inventoryModel.create(missing.map((stayDate) => ({
          roomTypeId: roomTypeObjectId,
          stayDate,
          total: roomType.totalRooms,
          blocked: 0,
          held: 0,
          confirmed: 0,
          version: 0,
        })), { session, ordered: true });
      }
      await this.audit.log({
        actorId: actor.id,
        actorType: 'STAFF',
        action: 'inventory.initialize',
        resourceType: 'ROOM_TYPE',
        resourceId: roomTypeObjectId.toString(),
        hotelId: roomType.hotelId.toString(),
        outcome: 'SUCCESS',
        metadata: { from: range.from, to: range.to, createdNights: missing.length },
        session,
      });
      return { roomTypeId: roomTypeObjectId.toString(), from: range.from, to: range.to, createdNights: missing.length };
    });
  }

  async block(roomTypeId: string, stayDate: string, dto: InventoryAdjustmentDto, actor: StaffPrincipal) {
    return this.adjustNight(roomTypeId, stayDate, dto, actor, 'BLOCK', dto.quantity);
  }

  async unblock(roomTypeId: string, stayDate: string, dto: InventoryAdjustmentDto, actor: StaffPrincipal) {
    return this.adjustNight(roomTypeId, stayDate, dto, actor, 'UNBLOCK', dto.quantity);
  }

  async adjustExistingNightsForTotal(
    session: ClientSession,
    roomType: RoomTypeDocument,
    newTotal: number,
    actor: StaffPrincipal,
    reason: string,
  ) {
    const query = { roomTypeId: roomType._id };
    const existingCount = await this.inventoryModel.countDocuments(query).session(session);
    const update = await this.inventoryModel.updateMany(
      {
        ...query,
        $expr: {
          $lte: [{ $add: ['$blocked', '$held', '$confirmed'] }, newTotal],
        },
      },
      { $set: { total: newTotal }, $inc: { version: 1 } },
      { session, runValidators: true },
    );
    if (update.matchedCount !== existingCount) {
      throw new ConflictException({
        error: 'INVENTORY_CAPACITY_CONFLICT',
        message: 'New room count is below blocked, held, or confirmed rooms on at least one date',
      });
    }
    await this.audit.log({
      actorId: actor.id,
      actorType: 'STAFF',
      action: 'inventory.total_change',
      resourceType: 'ROOM_TYPE',
      resourceId: roomType._id.toString(),
      hotelId: roomType.hotelId.toString(),
      outcome: 'SUCCESS',
      reason,
      metadata: { previousTotal: roomType.totalRooms, newTotal, affectedNights: existingCount },
      session,
    });
  }

  private async adjustNight(
    roomTypeId: string,
    stayDate: string,
    dto: InventoryAdjustmentDto,
    actor: StaffPrincipal,
    operation: 'BLOCK' | 'UNBLOCK',
    quantity: number,
  ) {
    validateDate(stayDate);
    return this.transactions.executeInTransaction(async (session) => {
      const roomType = await this.getRoomType(roomTypeId, session);
      assertHotelScope(actor, roomType.hotelId.toString());
      const inventory = await this.inventoryModel.findOne({ roomTypeId: roomType._id, stayDate }).session(session);
      if (!inventory) throw new NotFoundException({ error: 'INVENTORY_NOT_INITIALIZED', message: 'Initialize inventory for this date first' });
      if (inventory.version !== dto.version) throw versionConflict();

      const filter: Record<string, any> = { _id: inventory._id, version: dto.version };
      const update: Record<string, any> = { $inc: { version: 1 } };
      if (operation === 'BLOCK') {
        filter.$expr = { $gte: [{ $subtract: ['$total', { $add: ['$blocked', '$held', '$confirmed'] }] }, quantity] };
        update.$inc.blocked = quantity;
      } else {
        filter.blocked = { $gte: quantity };
        update.$inc.blocked = -quantity;
      }

      const after = await this.inventoryModel.findOneAndUpdate(filter, update, { new: true, session });
      if (!after) {
        const current = await this.inventoryModel.findById(inventory._id).session(session);
        if (!current || current.version !== dto.version) throw versionConflict();
        throw new ConflictException({
          error: operation === 'BLOCK' ? 'INVENTORY_UNAVAILABLE' : 'BLOCKED_QUANTITY_INSUFFICIENT',
          message: operation === 'BLOCK' ? 'Not enough uncommitted rooms remain for this block' : 'Cannot unblock more rooms than are currently blocked',
        });
      }

      await this.audit.log({
        actorId: actor.id,
        actorType: 'STAFF',
        action: operation === 'BLOCK' ? 'inventory.block' : 'inventory.unblock',
        resourceType: 'NIGHT_INVENTORY',
        resourceId: after._id.toString(),
        hotelId: roomType.hotelId.toString(),
        outcome: 'SUCCESS',
        reason: dto.reason.trim(),
        metadata: {
          roomTypeId: roomType._id.toString(),
          stayDate,
          quantity,
          blockedBefore: inventory.blocked,
          blockedAfter: after.blocked,
          version: after.version,
        },
        session,
      });
      return { ...after.toObject(), available: after.total - after.blocked - after.held - after.confirmed };
    });
  }

  private async getRoomType(id: string, session?: ClientSession) {
    const query = this.roomTypeModel.findById(asObjectId(id));
    if (session) query.session(session);
    const roomType = await query;
    if (!roomType) throw new NotFoundException('Room type not found');
    return roomType;
  }
}

export function dateRange(from: string, to: string): string[] {
  validateDate(from);
  validateDate(to);
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  const dayCount = (end - start) / 86_400_000;
  if (!Number.isInteger(dayCount) || dayCount < 1) throw new UnprocessableEntityException('to must be later than from');
  if (dayCount > MAX_RANGE_DAYS) throw new UnprocessableEntityException(`Inventory ranges cannot exceed ${MAX_RANGE_DAYS} nights`);
  return Array.from({ length: dayCount }, (_, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
}

function validateDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new UnprocessableEntityException('Stay date must be a valid local calendar date in YYYY-MM-DD format');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new UnprocessableEntityException('Stay date must be a valid local calendar date in YYYY-MM-DD format');
  }
}

function asObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Room type not found');
  return new Types.ObjectId(id);
}

function assertHotelScope(actor: StaffPrincipal, hotelId: string) {
  if (actor.role !== 'SUPER_ADMIN' && !actor.hotelIds?.includes(hotelId)) {
    throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Hotel is outside the staff member scope' });
  }
}

function versionConflict() {
  return new ConflictException({ error: 'VERSION_CONFLICT', message: 'Inventory was changed by another request' });
}
