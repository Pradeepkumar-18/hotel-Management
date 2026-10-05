import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { TransactionService } from '../../common/database/transaction.service';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { AuditService } from '../audit/audit.service';
import { Hotel, HotelDocument, HotelStatus } from './schemas/hotel.schema';
import { RoomType, RoomTypeDocument, RoomTypeStatus } from './schemas/room-type.schema';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/room-type.dto';
import { asObjectId } from './hotel.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class RoomTypeService {
  constructor(
    @InjectModel(Hotel.name) private readonly hotelModel: Model<HotelDocument>,
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    private readonly audit: AuditService,
    private readonly transactions: TransactionService,
    private readonly inventory: InventoryService,
  ) {}

  async listForHotel(hotelId: string, includeDisabled = false) {
    const id = asObjectId(hotelId);
    const filter: Record<string, unknown> = { hotelId: id };
    if (!includeDisabled) filter.status = RoomTypeStatus.ACTIVE;
    return this.roomTypeModel.find(filter).sort({ name: 1 }).lean();
  }

  async create(hotelId: string, dto: CreateRoomTypeDto, actor: StaffPrincipal) {
    const hotelObjectId = asObjectId(hotelId);
    const hotel = await this.hotelModel.findById(hotelObjectId).lean();
    if (!hotel || hotel.status === HotelStatus.ARCHIVED) throw new NotFoundException('Hotel not found');
    validateBeds(dto.beds || []);
    const code = dto.code.trim().toUpperCase();
    const payload = {
      ...dto,
      hotelId: hotelObjectId,
      name: dto.name.trim(),
      code,
      normalizedCode: code.toLowerCase(),
      description: dto.description?.trim() || undefined,
      maxChildren: dto.maxChildren ?? 0,
      beds: dto.beds || [],
      amenities: [...new Set((dto.amenities || []).map((item) => item.trim()).filter(Boolean))],
      status: RoomTypeStatus.ACTIVE,
      version: 0,
    };

    return this.transactions.executeInTransaction(async (session) => {
      const roomType = await this.roomTypeModel.create([payload], { session }).then(([created]) => created);
      await this.writeAudit(session, actor, 'room_type.create', roomType, undefined, roomType.toObject());
      return roomType;
    }).catch(mapDuplicate);
  }

  async getById(id: string, actor: StaffPrincipal) {
    const roomType = await this.roomTypeModel.findById(asObjectId(id)).lean();
    if (!roomType) throw new NotFoundException('Room type not found');
    assertHotelScope(actor, roomType.hotelId.toString());
    return roomType;
  }

  async update(id: string, dto: UpdateRoomTypeDto, actor: StaffPrincipal) {
    const roomTypeId = asObjectId(id);
    const before = await this.roomTypeModel.findById(roomTypeId).lean();
    if (!before) throw new NotFoundException('Room type not found');
    assertHotelScope(actor, before.hotelId.toString());
    if (before.version !== dto.version) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Room type was changed by another request' });
    const roomCountChanged = dto.totalRooms !== undefined && dto.totalRooms !== before.totalRooms;
    if (roomCountChanged && !dto.reason?.trim()) {
      throw new UnprocessableEntityException('A reason is required when changing the sellable room count');
    }
    if (dto.beds) validateBeds(dto.beds);
    const { version, reason, ...changes } = dto;
    const update: Record<string, unknown> = { ...changes };
    if (changes.name) update.name = changes.name.trim();
    if (changes.code) {
      update.code = changes.code.trim().toUpperCase();
      update.normalizedCode = changes.code.trim().toLowerCase();
    }
    if (changes.description !== undefined) update.description = changes.description.trim() || undefined;
    if (changes.amenities) update.amenities = [...new Set(changes.amenities.map((item) => item.trim()).filter(Boolean))];

    return this.transactions.executeInTransaction(async (session) => {
      if (roomCountChanged) {
        await this.inventory.adjustExistingNightsForTotal(session, before as any, dto.totalRooms!, actor, reason!.trim());
      }
      const after = await this.roomTypeModel.findOneAndUpdate(
        { _id: roomTypeId, version },
        { $set: update, $inc: { version: 1 } },
        { new: true, runValidators: true, session },
      );
      if (!after) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Room type was changed by another request' });
      await this.writeAudit(session, actor, 'room_type.update', after, before, after.toObject(), reason);
      return after;
    }).catch(mapDuplicate);
  }

  async disable(id: string, version: number, actor: StaffPrincipal, reason?: string) {
    const roomTypeId = asObjectId(id);
    const before = await this.roomTypeModel.findById(roomTypeId).lean();
    if (!before) throw new NotFoundException('Room type not found');
    assertHotelScope(actor, before.hotelId.toString());
    if (before.version !== version) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Room type was changed by another request' });
    if (before.status === RoomTypeStatus.DISABLED) return before;
    return this.transactions.executeInTransaction(async (session) => {
      const after = await this.roomTypeModel.findOneAndUpdate(
        { _id: roomTypeId, version },
        { $set: { status: RoomTypeStatus.DISABLED }, $inc: { version: 1 } },
        { new: true, session },
      );
      if (!after) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Room type was changed by another request' });
      await this.writeAudit(session, actor, 'room_type.disable', after, before, after.toObject(), reason);
      return after;
    });
  }

  private writeAudit(session: ClientSession, actor: StaffPrincipal, action: string, roomType: RoomTypeDocument, before?: any, after?: any, reason?: string) {
    return this.audit.log({
      actorId: actor.id,
      actorType: 'STAFF',
      action,
      resourceType: 'ROOM_TYPE',
      resourceId: roomType._id.toString(),
      hotelId: roomType.hotelId.toString(),
      outcome: 'SUCCESS',
      reason,
      metadata: { before: safeRoomView(before), after: safeRoomView(after), version: roomType.version },
      session,
    });
  }
}

function assertHotelScope(actor: StaffPrincipal, hotelId: string) {
  if (actor.role !== 'SUPER_ADMIN' && !actor.hotelIds?.includes(hotelId)) {
    throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Hotel is outside the staff member scope' });
  }
}

function validateBeds(beds: CreateRoomTypeDto['beds']) {
  if (beds && beds.some((bed) => !bed.type.trim() || !Number.isInteger(bed.quantity) || bed.quantity < 1)) {
    throw new UnprocessableEntityException('Bed configuration must have a type and positive integer quantity');
  }
}

function safeRoomView(value: any) {
  if (!value) return undefined;
  const { _id, hotelId, name, code, maxAdults, maxChildren, beds, totalRooms, status, version } = value;
  return { id: _id?.toString(), hotelId: hotelId?.toString(), name, code, maxAdults, maxChildren, beds, totalRooms, status, version };
}

function mapDuplicate(error: any): never {
  if (error?.code === 11000) throw new ConflictException({ error: 'DUPLICATE_ROOM_TYPE_CODE', message: 'A room type with this code already exists for the hotel' });
  throw error;
}
