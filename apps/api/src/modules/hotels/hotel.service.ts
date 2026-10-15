import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { AuditService } from '../audit/audit.service';
import { BulkHotelStatusDto, CreateHotelDto, HotelListQueryDto, SetHotelMediaDto, UpdateHotelDto } from './dto/hotel.dto';
import { Hotel, HotelAddress, HotelDocument, HotelStatus } from './schemas/hotel.schema';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { TransactionService } from '../../common/database/transaction.service';
import { RoomType, RoomTypeDocument, RoomTypeStatus } from './schemas/room-type.schema';
import { BaseRate, BaseRateDocument } from '../pricing/schemas/base-rate.schema';
import { NightInventory, NightInventoryDocument } from '../inventory/schemas/night-inventory.schema';
import { HotelCancellationPolicyDto } from './dto/hotel.dto';
import { BULK_TRANSITIONS, PERMISSION_FOR_STATUS } from './hotel-status.rules';
import { HotelPublishChecks } from './hotel-publish.checks';
import {
  asObjectId,
  assertHotelScope,
  dateInTimezone,
  escapeRegex,
  normalizeAddress,
  normalizeCancellationPolicy,
  normalizeContact,
  normalizeList,
  normalizeSlug,
  safeAuditView,
  validateCancellationPolicy,
  validatePolicyCurrency,
  validateTimezone,
} from './hotel.policies';

export interface PublicHotelDetail {
  id: string;
  name: string;
  slug: string;
  address: HotelAddress;
  timezone: string;
  description?: string;
  amenities: string[];
  cancellationPolicy?: HotelCancellationPolicy;
  roomTypes: Array<{
    id: string;
    name: string;
    description?: string;
    maxAdults: number;
    maxChildren: number;
    beds: Array<{ type: string; quantity: number }>;
    amenities: string[];
    baseRate?: { amountMinorUnits: number; currency: string };
  }>;
}
import { CancellationFeeBasis, HotelCancellationPolicy } from './schemas/hotel.schema';

@Injectable()
export class HotelService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Hotel.name) private readonly hotelModel: Model<HotelDocument>,
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    @InjectModel(BaseRate.name) private readonly baseRateModel: Model<BaseRateDocument>,
    @InjectModel(NightInventory.name) private readonly inventoryModel: Model<NightInventoryDocument>,
    private readonly audit: AuditService,
    private readonly transactions: TransactionService,
    private readonly publishChecks: HotelPublishChecks,
  ) {}

  async list(query: HotelListQueryDto, actor: StaffPrincipal) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.city) filter['address.city'] = new RegExp(`^${escapeRegex(query.city.trim())}$`, 'i');
    if (query.search?.trim()) {
      filter.$text = { $search: query.search.trim() };
    }
    if (query.setupStatus === 'COMPLETED') {
      filter.status = HotelStatus.PUBLISHED;
    } else if (query.setupStatus === 'IN_PROGRESS') {
      filter.status = { $ne: HotelStatus.PUBLISHED };
    }
    if (actor.role !== 'SUPER_ADMIN') filter._id = { $in: (actor.hotelIds || []).map(asObjectId) };
    const [items, total] = await Promise.all([
      this.hotelModel.find(filter).sort({ name: 1 }).skip(query.offset).limit(query.limit).lean(),
      this.hotelModel.countDocuments(filter),
    ]);
    return { items, total, limit: query.limit, offset: query.offset };
  }

  async getMetrics(actor: StaffPrincipal): Promise<{
    total: number;
    published: number;
    draft: number;
    suspended: number;
    archived: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (actor.role !== 'SUPER_ADMIN') {
      filter._id = { $in: (actor.hotelIds || []).map(asObjectId) };
    }

    const [published, draft, suspended, archived, total] = await Promise.all([
      this.hotelModel.countDocuments({ ...filter, status: HotelStatus.PUBLISHED }),
      this.hotelModel.countDocuments({ ...filter, status: HotelStatus.DRAFT }),
      this.hotelModel.countDocuments({ ...filter, status: HotelStatus.SUSPENDED }),
      this.hotelModel.countDocuments({ ...filter, status: HotelStatus.ARCHIVED }),
      this.hotelModel.countDocuments(filter),
    ]);

    return { total, published, draft, suspended, archived };
  }

  async updateMedia(id: string, dto: SetHotelMediaDto, actor: StaffPrincipal) {
    assertHotelScope(actor, id);
    const hotel = await this.getById(id, actor);
    if (hotel.version !== dto.version) {
      throw new ConflictException({ error: 'CONCURRENCY_CONFLICT', message: 'Hotel document was updated by another request' });
    }

    const mediaList = dto.media.map((item, idx) => ({
      url: item.url.trim(),
      isPrimary: !!item.isPrimary,
      caption: item.caption?.trim(),
      displayOrder: item.displayOrder ?? idx,
    }));

    const primaryItem = mediaList.find((m) => m.isPrimary) || mediaList[0];
    const primaryImage = primaryItem ? primaryItem.url : undefined;

    return this.transactions.executeInTransaction(async (session) => {
      const updated = await this.hotelModel.findOneAndUpdate(
        { _id: asObjectId(id), version: dto.version },
        {
          $set: {
            media: mediaList,
            primaryImage,
          },
          $inc: { version: 1 },
        },
        { new: true, session },
      );
      if (!updated) {
        throw new ConflictException({ error: 'CONCURRENCY_CONFLICT', message: 'Hotel document version conflict' });
      }
      await this.writeAudit(session, actor, 'hotel.media_update', updated, hotel, updated.toObject());
      return updated;
    });
  }

  async bulkStatusUpdate(dto: BulkHotelStatusDto, actor: StaffPrincipal) {
    const required = PERMISSION_FOR_STATUS[dto.status];
    if (actor.role !== 'SUPER_ADMIN' && !(actor.permissions || []).includes(required)) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: `Bulk status update to ${dto.status} requires ${required} permission` });
    }

    const objectIds = dto.hotelIds.map(asObjectId);

    return this.transactions.executeInTransaction(async (session) => {
      const hotels = await this.hotelModel.find({ _id: { $in: objectIds } }).session(session);
      const found = new Map(hotels.map((h) => [h._id.toString(), h]));
      const updated: string[] = [];
      const skipped: { hotelId: string; code: string; message: string }[] = [];

      for (const id of dto.hotelIds) {
        const h = found.get(id);
        if (!h) {
          skipped.push({ hotelId: id, code: 'NOT_FOUND', message: 'Hotel not found' });
          continue;
        }
        if (actor.role !== 'SUPER_ADMIN' && !(actor.hotelIds || []).includes(id)) {
          skipped.push({ hotelId: id, code: 'FORBIDDEN', message: 'Outside your hotel scope' });
          continue;
        }
        const allowedTransitions = BULK_TRANSITIONS[h.status] || [];
        if (!allowedTransitions.includes(dto.status)) {
          skipped.push({ hotelId: id, code: 'INVALID_TRANSITION', message: `Cannot move ${h.status} to ${dto.status}` });
          continue;
        }
        if (dto.status === HotelStatus.PUBLISHED) {
          const problems = await this.publishChecks.collect(h, session);
          if (problems.length > 0) {
            skipped.push({ hotelId: id, code: 'NOT_READY', message: problems[0].message });
            continue;
          }
        }
        const res = await this.hotelModel.updateOne(
          { _id: h._id, version: h.version, status: h.status },
          { $set: { status: dto.status }, $inc: { version: 1 } },
          { session },
        );
        if (res.modifiedCount === 1) {
          updated.push(id);
        } else {
          skipped.push({ hotelId: id, code: 'VERSION_CONFLICT', message: 'Changed by another request' });
        }
      }

      await this.audit.log({
        actorId: actor.id,
        actorType: 'STAFF',
        action: 'hotel.bulk_status_update',
        resourceType: 'HOTEL',
        resourceId: 'bulk',
        outcome: 'SUCCESS',
        reason: dto.reason,
        metadata: { status: dto.status, modifiedCount: updated.length, updated, skipped },
        session,
      });

      return {
        modifiedCount: updated.length,
        status: dto.status,
        updated,
        skipped,
      };
    });
  }


  async create(dto: CreateHotelDto, actor: StaffPrincipal) {
    validateTimezone(dto.timezone);
    if ((dto.latitude === undefined) !== (dto.longitude === undefined)) {
      throw new UnprocessableEntityException('Provide both latitude and longitude');
    }
    if (!dto.contact.email && !dto.contact.phone) {
      throw new UnprocessableEntityException('Provide at least one hotel contact method');
    }
    const slug = normalizeSlug(dto.slug);
    const payload = {
      ...dto,
      slug,
      name: dto.name.trim(),
      timezone: dto.timezone.trim(),
      address: normalizeAddress(dto.address),
      contact: normalizeContact(dto.contact),
      coordinates: dto.latitude === undefined && dto.longitude === undefined
        ? undefined
        : { latitude: dto.latitude, longitude: dto.longitude },
      amenities: normalizeList(dto.amenities),
      cancellationPolicy: dto.cancellationPolicy
        ? normalizeCancellationPolicy(dto.cancellationPolicy, 1)
        : undefined,
      status: HotelStatus.DRAFT,
      version: 0,
    };

    return this.transactions.executeInTransaction(async (session) => {
      const hotel = await this.hotelModel.create([payload], { session }).then(([created]) => created);
      await this.writeAudit(session, actor, 'hotel.create', hotel, undefined, hotel.toObject());
      return hotel;
    }).catch(mapDuplicate);
  }

  async getById(id: string, actor: StaffPrincipal) {
    const hotel = await this.hotelModel.findById(asObjectId(id)).lean();
    if (!hotel) throw new NotFoundException('Hotel not found');
    assertHotelScope(actor, hotel._id.toString());
    return hotel;
  }

  async getPublicBySlug(slug: string): Promise<PublicHotelDetail> {
    const hotel = await this.hotelModel.findOne({ slug: normalizeSlug(slug), status: HotelStatus.PUBLISHED }).lean();
    if (!hotel) throw new NotFoundException('Hotel not found');
    const roomTypes = await this.roomTypeModel
      .find({ hotelId: hotel._id, status: RoomTypeStatus.ACTIVE })
      .select('name description maxAdults maxChildren beds amenities')
      .sort({ name: 1 })
      .lean();
    const rates = await this.baseRateModel
      .find({ roomTypeId: { $in: roomTypes.map((roomType) => roomType._id) } })
      .lean();
    const ratesByRoomType = new Map(rates.map((rate) => [rate.roomTypeId.toString(), rate]));
    return {
      id: hotel._id.toString(),
      name: hotel.name,
      slug: hotel.slug,
      address: hotel.address,
      timezone: hotel.timezone,
      description: hotel.description,
      amenities: hotel.amenities,
      cancellationPolicy: hotel.cancellationPolicy,
      roomTypes: roomTypes.map((roomType) => {
        const rate = ratesByRoomType.get(roomType._id.toString());
        return {
          id: roomType._id.toString(),
          name: roomType.name,
          description: roomType.description,
          maxAdults: roomType.maxAdults,
          maxChildren: roomType.maxChildren,
          beds: roomType.beds,
          amenities: roomType.amenities,
          baseRate: rate ? { amountMinorUnits: rate.amountMinorUnits, currency: rate.currency } : undefined,
        };
      }),
    };
  }

  async update(id: string, dto: UpdateHotelDto, actor: StaffPrincipal) {
    const hotelId = asObjectId(id);
    const before = await this.hotelModel.findById(hotelId).lean();
    if (!before) throw new NotFoundException('Hotel not found');
    assertHotelScope(actor, before._id.toString());
    if (before.version !== dto.version) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Hotel was changed by another request' });
    if (dto.timezone) validateTimezone(dto.timezone);
    if (dto.timezone && dto.timezone !== before.timezone) {
      const localToday = dateInTimezone(new Date(), before.timezone);
      const futureBookings = await this.connection.collection('bookings').countDocuments({
        hotelId,
        checkOut: { $gt: localToday },
      });
      if (futureBookings > 0) {
        throw new ConflictException({ error: 'HOTEL_TIMEZONE_HAS_FUTURE_BOOKINGS', message: 'Timezone cannot change while future bookings exist' });
      }
    }
    if (dto.contact && !dto.contact.email && !dto.contact.phone) {
      throw new UnprocessableEntityException('Provide at least one hotel contact method');
    }
    const { version, latitude, longitude, ...changes } = dto;
    if ((latitude === undefined) !== (longitude === undefined)) {
      throw new UnprocessableEntityException('Provide both latitude and longitude');
    }
    const update: Record<string, unknown> = { ...changes };
    if (changes.slug) update.slug = normalizeSlug(changes.slug);
    if (changes.name) update.name = changes.name.trim();
    if (changes.timezone) update.timezone = changes.timezone.trim();
    if (changes.address) update.address = normalizeAddress(changes.address);
    if (changes.contact) update.contact = normalizeContact(changes.contact);
    if (changes.amenities) update.amenities = normalizeList(changes.amenities);
    if (changes.cancellationPolicy) {
      update.cancellationPolicy = normalizeCancellationPolicy(
        changes.cancellationPolicy,
        (before.cancellationPolicy?.version || 0) + 1,
      );
    }
    if (latitude !== undefined || longitude !== undefined) {
      update.coordinates = latitude === undefined || longitude === undefined ? undefined : { latitude, longitude };
    }

    return this.transactions.executeInTransaction(async (session) => {
      const after = await this.hotelModel.findOneAndUpdate(
        { _id: hotelId, version },
        { $set: update, $inc: { version: 1 } },
        { new: true, runValidators: true, session },
      );
      if (!after) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Hotel was changed by another request' });
      await this.writeAudit(session, actor, 'hotel.update', after, before, after.toObject());
      return after;
    }).catch(mapDuplicate);
  }

  async publish(id: string, version: number, actor: StaffPrincipal) {
    const hotelId = asObjectId(id);
    return this.transactions.executeInTransaction(async (session) => {
      const hotel = await this.hotelModel.findById(hotelId).session(session);
      if (!hotel) throw new NotFoundException('Hotel not found');
      assertHotelScope(actor, hotel._id.toString());
      if (hotel.version !== version) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Hotel was changed by another request' });
      if (hotel.status === HotelStatus.ARCHIVED) throw new ConflictException('Archived hotels cannot be published');
      if (hotel.status === HotelStatus.PUBLISHED) return hotel;
      const problems = await this.publishChecks.collect(hotel, session);
      if (problems.length > 0) {
        throw new ConflictException({
          error: 'HOTEL_NOT_READY',
          message: problems[0].message,
          details: problems,
        });
      }

      const published = await this.hotelModel.findOneAndUpdate(
        { _id: hotelId, version, status: { $in: [HotelStatus.DRAFT, HotelStatus.SUSPENDED] } },
        { $set: { status: HotelStatus.PUBLISHED }, $inc: { version: 1 } },
        { new: true, session },
      );
      if (!published) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Hotel was changed by another request' });
      await this.writeAudit(session, actor, 'hotel.publish', published, hotel.toObject(), published.toObject());
      return published;
    });
  }

  async setStatus(id: string, status: HotelStatus.SUSPENDED | HotelStatus.ARCHIVED, version: number, actor: StaffPrincipal, reason?: string) {
    const hotelId = asObjectId(id);
    const before = await this.hotelModel.findById(hotelId).lean();
    if (!before) throw new NotFoundException('Hotel not found');
    assertHotelScope(actor, before._id.toString());
    if (before.version !== version) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Hotel was changed by another request' });
    if (before.status === HotelStatus.ARCHIVED && status !== HotelStatus.ARCHIVED) {
      throw new ConflictException('Archived hotels cannot be reactivated through this operation');
    }
    if (before.status === status) return before;
    return this.transactions.executeInTransaction(async (session) => {
      const after = await this.hotelModel.findOneAndUpdate(
        { _id: hotelId, version },
        { $set: { status }, $inc: { version: 1 } },
        { new: true, session },
      );
      if (!after) throw new ConflictException({ error: 'VERSION_CONFLICT', message: 'Hotel was changed by another request' });
      await this.writeAudit(session, actor, `hotel.${status.toLowerCase()}`, after, before, after.toObject(), reason);
      return after;
    });
  }

  private writeAudit(session: ClientSession, actor: StaffPrincipal, action: string, hotel: HotelDocument, before?: unknown, after?: unknown, reason?: string) {
    return this.audit.log({
      actorId: actor.id,
      actorType: 'STAFF',
      action,
      resourceType: 'HOTEL',
      resourceId: hotel._id.toString(),
      hotelId: hotel._id.toString(),
      outcome: 'SUCCESS',
      reason,
      metadata: { before: safeAuditView(before), after: safeAuditView(after), version: hotel.version },
      session,
    });
  }
}

function mapDuplicate(error: any): never {
  if (error?.code === 11000) throw new ConflictException({ error: 'DUPLICATE_HOTEL_SLUG', message: 'A hotel with this slug already exists' });
  throw error;
}

export { asObjectId };

