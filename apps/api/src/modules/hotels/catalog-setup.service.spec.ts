import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Connection, Model, Types } from 'mongoose';
import { TransactionService } from '../../common/database/transaction.service';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { AuditLog, AuditLogDocument, AuditLogSchema } from '../audit/schemas/audit-log.schema';
import { AuditService } from '../audit/audit.service';
import { NightInventory, NightInventoryDocument, NightInventorySchema } from '../inventory/schemas/night-inventory.schema';
import { BaseRate, BaseRateDocument, BaseRateSchema } from '../pricing/schemas/base-rate.schema';
import { HotelService } from './hotel.service';
import { Hotel, HotelDocument, HotelSchema } from './schemas/hotel.schema';
import { RoomType, RoomTypeDocument, RoomTypeSchema } from './schemas/room-type.schema';
import { PricingService } from '../pricing/pricing.service';

jest.setTimeout(120_000);

describe('Sprint 1 catalog setup acceptance', () => {
  let replicaSet: MongoMemoryReplSet;
  let connection: Connection;
  let hotelModel: Model<HotelDocument>;
  let roomTypeModel: Model<RoomTypeDocument>;
  let baseRateModel: Model<BaseRateDocument>;
  let inventoryModel: Model<NightInventoryDocument>;
  let auditModel: Model<AuditLogDocument>;
  let hotels: HotelService;
  let pricing: PricingService;

  const actor: StaffPrincipal = {
    id: new Types.ObjectId().toString(), audience: 'STAFF', status: 'ACTIVE', role: 'SUPER_ADMIN',
    permissions: ['hotels.view', 'hotels.publish', 'rates.view', 'rates.edit'], hotelIds: [],
  };

  beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1, name: 'staywise-catalog-rs' } });
    connection = await mongoose.createConnection(replicaSet.getUri()).asPromise();
    hotelModel = connection.model(Hotel.name, HotelSchema) as unknown as Model<HotelDocument>;
    roomTypeModel = connection.model(RoomType.name, RoomTypeSchema) as unknown as Model<RoomTypeDocument>;
    baseRateModel = connection.model(BaseRate.name, BaseRateSchema) as unknown as Model<BaseRateDocument>;
    inventoryModel = connection.model(NightInventory.name, NightInventorySchema) as unknown as Model<NightInventoryDocument>;
    auditModel = connection.model(AuditLog.name, AuditLogSchema) as unknown as Model<AuditLogDocument>;
    await Promise.all([hotelModel.init(), roomTypeModel.init(), baseRateModel.init(), inventoryModel.init(), auditModel.init()]);
    const audit = new AuditService(auditModel);
    const transactions = new TransactionService(connection);
    hotels = new HotelService(connection, hotelModel, roomTypeModel, baseRateModel, inventoryModel, audit, transactions);
    pricing = new PricingService(roomTypeModel, baseRateModel, audit, transactions);
  });

  beforeEach(async () => {
    await Promise.all([hotelModel.deleteMany({}), roomTypeModel.deleteMany({}), baseRateModel.deleteMany({}), inventoryModel.deleteMany({}), auditModel.deleteMany({})]);
  });

  afterAll(async () => { await connection?.close(); await replicaSet?.stop(); });

  async function setupHotel({ policy = true, rate = true, inventory = true } = {}) {
    const hotel = await hotelModel.create({
      name: 'Staywise Test Hotel', slug: `staywise-${new Types.ObjectId().toString().slice(-8)}`,
      address: { line1: '1 Test Road', city: 'Bengaluru', postalCode: '560001', countryCode: 'IN' },
      timezone: 'Asia/Kolkata', contact: { email: 'hotel@example.test' }, status: 'DRAFT', version: 0,
      ...(policy ? { cancellationPolicy: {
        effectiveFrom: new Date().toISOString().slice(0, 10), freeCancellationHoursBeforeCheckIn: 24,
        afterCutoff: { basis: 'NO_FEE' }, noShow: { basis: 'FULL_STAY' }, version: 1,
      } } : {}),
    });
    const room = await roomTypeModel.create({ hotelId: hotel._id, name: 'Standard', code: `STD-${hotel._id.toString().slice(-5)}`, normalizedCode: `std-${hotel._id.toString().slice(-5)}`, maxAdults: 2, maxChildren: 1, totalRooms: 4, status: 'ACTIVE', version: 0, inventoryRevision: 0 });
    if (rate) await baseRateModel.create({ roomTypeId: room._id, amountMinorUnits: 12000, currency: 'INR', version: 0 });
    if (inventory) await inventoryModel.create({ roomTypeId: room._id, stayDate: '2099-01-01', total: 4, blocked: 0, held: 0, confirmed: 0, version: 0 });
    return { hotel, room };
  }

  it('enforces publication gates for explicit policy, base rate, and future inventory', async () => {
    const noPolicy = await setupHotel({ policy: false });
    await expect(hotels.publish(noPolicy.hotel.id, 0, actor)).rejects.toMatchObject({ response: expect.objectContaining({ error: 'HOTEL_CANCELLATION_POLICY_REQUIRED' }) });

    const noRate = await setupHotel({ rate: false });
    await expect(hotels.publish(noRate.hotel.id, 0, actor)).rejects.toMatchObject({ response: expect.objectContaining({ error: 'HOTEL_BASE_RATES_REQUIRED' }) });

    const noInventory = await setupHotel({ inventory: false });
    await expect(hotels.publish(noInventory.hotel.id, 0, actor)).rejects.toMatchObject({ response: expect.objectContaining({ error: 'HOTEL_FUTURE_INVENTORY_REQUIRED' }) });

    const ready = await setupHotel();
    const published = await hotels.publish(ready.hotel.id, 0, actor);
    expect(published.status).toBe('PUBLISHED');
    expect(published.version).toBe(1);
    expect(await auditModel.countDocuments({ action: 'hotel.publish', resourceId: ready.hotel.id })).toBe(1);
  });

  it('versions base rates, normalizes currency, rejects stale edits, and audits changes', async () => {
    const { room } = await setupHotel({ rate: false });
    const created = await pricing.setBaseRate(room.id, { amountMinorUnits: 15000, currency: 'inr', reason: 'Initial approved rate' }, actor);
    expect(created.currency).toBe('INR');
    expect(created.version).toBe(0);
    const updated = await pricing.setBaseRate(room.id, { amountMinorUnits: 17000, currency: 'INR', version: 0, reason: 'Seasonal setup correction' }, actor);
    expect(updated.amountMinorUnits).toBe(17000);
    expect(updated.version).toBe(1);
    await expect(pricing.setBaseRate(room.id, { amountMinorUnits: 18000, currency: 'INR', version: 0, reason: 'Stale edit' }, actor)).rejects.toMatchObject({ response: expect.objectContaining({ error: 'VERSION_CONFLICT' }) });
    expect(await auditModel.countDocuments({ resourceType: 'BASE_RATE' })).toBe(2);
  });
});
