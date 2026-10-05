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
import { CreateHotelDto, HotelListQueryDto, UpdateHotelDto } from './dto/hotel.dto';
import { Hotel, HotelAddress, HotelDocument, HotelStatus } from './schemas/hotel.schema';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { TransactionService } from '../../common/database/transaction.service';
import { RoomType, RoomTypeDocument, RoomTypeStatus } from './schemas/room-type.schema';
import { BaseRate, BaseRateDocument } from '../pricing/schemas/base-rate.schema';
import { NightInventory, NightInventoryDocument } from '../inventory/schemas/night-inventory.schema';
import { HotelCancellationPolicyDto } from './dto/hotel.dto';

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
  ) {}

  async list(query: HotelListQueryDto, actor: StaffPrincipal) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.city) filter['address.city'] = new RegExp(`^${escapeRegex(query.city.trim())}$`, 'i');
    if (actor.role !== 'SUPER_ADMIN') filter._id = { $in: (actor.hotelIds || []).map(asObjectId) };
    const [items, total] = await Promise.all([
      this.hotelModel.find(filter).sort({ name: 1 }).skip(query.offset).limit(query.limit).lean(),
      this.hotelModel.countDocuments(filter),
    ]);
    return { items, total, limit: query.limit, offset: query.offset };
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
      if (!hotel.cancellationPolicy) {
        throw new ConflictException({ error: 'HOTEL_CANCELLATION_POLICY_REQUIRED', message: 'Set explicit cancellation and no-show terms before publication' });
      }
      validateCancellationPolicy(hotel.cancellationPolicy);

      const localToday = dateInTimezone(new Date(), hotel.timezone);
      if (hotel.cancellationPolicy.effectiveFrom > localToday) {
        throw new ConflictException({ error: 'HOTEL_POLICY_NOT_YET_EFFECTIVE', message: 'Cancellation policy is not effective yet' });
      }

      const roomTypes = await this.roomTypeModel
        .find({ hotelId, status: RoomTypeStatus.ACTIVE })
        .session(session)
        .lean();
      if (roomTypes.length === 0) {
        throw new ConflictException({ error: 'HOTEL_ACTIVE_ROOM_TYPES_REQUIRED', message: 'Add at least one active room type before publication' });
      }
      if (roomTypes.some((roomType) => roomType.totalRooms < 1)) {
        throw new ConflictException({ error: 'HOTEL_SELLABLE_INVENTORY_REQUIRED', message: 'Every active room type needs a positive sellable room total' });
      }

      const roomTypeIds = roomTypes.map((roomType) => roomType._id);
      const rates = await this.baseRateModel.find({ roomTypeId: { $in: roomTypeIds } }).session(session).lean();
      if (rates.length !== roomTypes.length) {
        throw new ConflictException({ error: 'HOTEL_BASE_RATES_REQUIRED', message: 'Set a base rate for every active room type before publication' });
      }
      const currencies = new Set(rates.map((rate) => rate.currency));
      if (currencies.size !== 1) {
        throw new ConflictException({ error: 'HOTEL_RATE_CURRENCY_MISMATCH', message: 'All active room type base rates must use one hotel currency' });
      }
      validatePolicyCurrency(hotel.cancellationPolicy, [...currencies][0]);

      const stockedRoomTypeIds = await this.inventoryModel
        .find({
          roomTypeId: { $in: roomTypeIds },
          stayDate: { $gte: localToday },
          $expr: { $gt: [{ $subtract: ['$total', { $add: ['$blocked', '$held', '$confirmed'] }] }, 0] },
        })
        .distinct('roomTypeId')
        .session(session);
      if (roomTypes.some((roomType) => !stockedRoomTypeIds.some((stockedId) => stockedId.toString() === roomType._id.toString()))) {
        throw new ConflictException({ error: 'HOTEL_FUTURE_INVENTORY_REQUIRED', message: 'Every active room type needs at least one future night with available rooms' });
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

export function asObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Resource not found');
  return new Types.ObjectId(id);
}

function normalizeSlug(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new UnprocessableEntityException('Hotel slug must contain letters or numbers');
  return slug;
}

function normalizeAddress(address: CreateHotelDto['address']) {
  return {
    ...address,
    line1: address.line1.trim(),
    line2: address.line2?.trim() || undefined,
    city: address.city.trim(),
    region: address.region?.trim() || undefined,
    postalCode: address.postalCode.trim(),
    countryCode: address.countryCode.trim().toUpperCase(),
  };
}

function normalizeContact(contact: CreateHotelDto['contact']) {
  return { email: contact.email?.trim().toLowerCase() || undefined, phone: contact.phone?.trim() || undefined };
}

function normalizeCancellationPolicy(dto: HotelCancellationPolicyDto, version: number): HotelCancellationPolicy {
  const policy = {
    effectiveFrom: dto.effectiveFrom,
    freeCancellationHoursBeforeCheckIn: dto.freeCancellationHoursBeforeCheckIn,
    afterCutoff: normalizeFeeRule(dto.afterCutoff),
    noShow: normalizeFeeRule(dto.noShow),
    version,
  };
  validateCancellationPolicy(policy);
  return policy;
}

function normalizeFeeRule(rule: HotelCancellationPolicyDto['afterCutoff']) {
  if (!rule || !Object.values(CancellationFeeBasis).includes(rule.basis)) {
    throw new UnprocessableEntityException('Cancellation fee rule basis is invalid');
  }
  const normalized = {
    basis: rule.basis,
    amountMinorUnits: rule.amountMinorUnits,
    currency: rule.currency?.toUpperCase(),
    percentageBps: rule.percentageBps,
  };
  const fixed = rule.basis === CancellationFeeBasis.FIXED_MINOR_UNITS;
  const percentage = rule.basis === CancellationFeeBasis.PERCENTAGE_BPS;
  if (fixed && (!Number.isSafeInteger(rule.amountMinorUnits) || !rule.currency || !/^[A-Z]{3}$/.test(rule.currency.toUpperCase()))) {
    throw new UnprocessableEntityException('Fixed cancellation fees require integer minor units and an ISO currency code');
  }
  if (percentage && (!Number.isInteger(rule.percentageBps) || rule.percentageBps! < 0 || rule.percentageBps! > 10000)) {
    throw new UnprocessableEntityException('Percentage cancellation fees require basis points from 0 to 10000');
  }
  if (!fixed && (rule.amountMinorUnits !== undefined || rule.currency !== undefined)) {
    throw new UnprocessableEntityException('Only fixed cancellation fees accept an amount and currency');
  }
  if (!percentage && rule.percentageBps !== undefined) {
    throw new UnprocessableEntityException('Only percentage cancellation fees accept basis points');
  }
  return normalized;
}

function validateCancellationPolicy(policy: HotelCancellationPolicy) {
  if (!policy || !policy.afterCutoff || !policy.noShow) {
    throw new UnprocessableEntityException('Cancellation and no-show fee terms are required');
  }
  const date = new Date(`${policy.effectiveFrom}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.effectiveFrom) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== policy.effectiveFrom) {
    throw new UnprocessableEntityException('Cancellation policy effectiveFrom must be a valid YYYY-MM-DD date');
  }
  if (!Number.isInteger(policy.freeCancellationHoursBeforeCheckIn) || policy.freeCancellationHoursBeforeCheckIn < 0 || policy.freeCancellationHoursBeforeCheckIn > 8760) {
    throw new UnprocessableEntityException('Free cancellation cutoff must be between 0 and 8760 hours before check-in');
  }
  normalizeFeeRule(policy.afterCutoff as any);
  normalizeFeeRule(policy.noShow as any);
}

function validatePolicyCurrency(policy: HotelCancellationPolicy, rateCurrency: string) {
  for (const fee of [policy.afterCutoff, policy.noShow]) {
    if (fee.basis === CancellationFeeBasis.FIXED_MINOR_UNITS && fee.currency !== rateCurrency) {
      throw new ConflictException({ error: 'HOTEL_POLICY_CURRENCY_MISMATCH', message: 'Fixed policy fees must use the hotel base-rate currency' });
    }
  }
}

function normalizeList(values?: string[]) {
  return [...new Set((values || []).map((value) => value.trim()).filter(Boolean))];
}

function validateTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
  } catch {
    throw new UnprocessableEntityException('timezone must be a supported IANA timezone');
  }
}

function dateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function safeAuditView(value: any) {
  if (!value) return undefined;
  const { _id, name, slug, address, timezone, status, version, contact, coordinates, cancellationPolicy } = value;
  return { id: _id?.toString(), name, slug, address, timezone, status, version, contact, coordinates, cancellationPolicy };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapDuplicate(error: any): never {
  if (error?.code === 11000) throw new ConflictException({ error: 'DUPLICATE_HOTEL_SLUG', message: 'A hotel with this slug already exists' });
  throw error;
}

function assertHotelScope(actor: StaffPrincipal, hotelId: string) {
  if (actor.role !== 'SUPER_ADMIN' && !actor.hotelIds?.includes(hotelId)) {
    throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Hotel is outside the staff member scope' });
  }
}
