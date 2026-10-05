import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { TransactionService } from '../../common/database/transaction.service';
import { AuditService } from '../audit/audit.service';
import { RoomType, RoomTypeDocument } from '../hotels/schemas/room-type.schema';
import { BaseRate, BaseRateDocument } from './schemas/base-rate.schema';
import { SetBaseRateDto } from './dto/base-rate.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    @InjectModel(BaseRate.name) private readonly baseRateModel: Model<BaseRateDocument>,
    private readonly audit: AuditService,
    private readonly transactions: TransactionService,
  ) {}

  async getBaseRate(roomTypeId: string, actor: StaffPrincipal) {
    const roomType = await this.getRoomType(roomTypeId);
    assertHotelScope(actor, roomType.hotelId.toString());
    const rate = await this.baseRateModel.findOne({ roomTypeId: roomType._id }).lean();
    if (!rate) throw new NotFoundException({ error: 'BASE_RATE_NOT_SET', message: 'No base rate is configured for this room type' });
    return rate;
  }

  async setBaseRate(roomTypeId: string, dto: SetBaseRateDto, actor: StaffPrincipal) {
    const roomTypeObjectId = asObjectId(roomTypeId);
    const currency = dto.currency.toUpperCase();
    if (!Number.isSafeInteger(dto.amountMinorUnits)) {
      throw new UnprocessableEntityException('amountMinorUnits must be a safe integer');
    }
    return this.transactions.executeInTransaction(async (session) => {
      const roomType = await this.getRoomType(roomTypeId, session);
      assertHotelScope(actor, roomType.hotelId.toString());
      const before = await this.baseRateModel.findOne({ roomTypeId: roomTypeObjectId }).session(session);
      let after: BaseRateDocument;
      if (!before) {
        if (dto.version !== undefined && dto.version !== 0) throw versionConflict();
        [after] = await this.baseRateModel.create([{
          roomTypeId: roomTypeObjectId,
          amountMinorUnits: dto.amountMinorUnits,
          currency,
          version: 0,
        }], { session });
      } else {
        if (dto.version === undefined || before.version !== dto.version) throw versionConflict();
        const updated = await this.baseRateModel.findOneAndUpdate(
          { _id: before._id, version: dto.version },
          { $set: { amountMinorUnits: dto.amountMinorUnits, currency }, $inc: { version: 1 } },
          { new: true, runValidators: true, session },
        );
        if (!updated) throw versionConflict();
        after = updated;
      }
      await this.audit.log({
        actorId: actor.id,
        actorType: 'STAFF',
        action: before ? 'rate.base.update' : 'rate.base.create',
        resourceType: 'BASE_RATE',
        resourceId: after._id.toString(),
        hotelId: roomType.hotelId.toString(),
        outcome: 'SUCCESS',
        reason: dto.reason.trim(),
        metadata: {
          roomTypeId: roomTypeObjectId.toString(),
          before: before ? { amountMinorUnits: before.amountMinorUnits, currency: before.currency, version: before.version } : undefined,
          after: { amountMinorUnits: after.amountMinorUnits, currency: after.currency, version: after.version },
        },
        session,
      });
      return after;
    }).catch((error) => {
      if (error?.code === 11000) throw new ConflictException({ error: 'BASE_RATE_CONFLICT', message: 'A base rate already exists for this room type; reload and update it' });
      throw error;
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
  return new ConflictException({ error: 'VERSION_CONFLICT', message: 'Base rate was changed by another request' });
}

