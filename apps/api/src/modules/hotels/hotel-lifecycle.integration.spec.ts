import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Connection, Model, Types } from 'mongoose';
import { TransactionService } from '../../common/database/transaction.service';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { AuditLog, AuditLogDocument, AuditLogSchema } from '../audit/schemas/audit-log.schema';
import { AuditService } from '../audit/audit.service';
import { NightInventory, NightInventoryDocument, NightInventorySchema } from '../inventory/schemas/night-inventory.schema';
import { InventoryService } from '../inventory/inventory.service';
import { BaseRate, BaseRateDocument, BaseRateSchema } from '../pricing/schemas/base-rate.schema';
import { PricingService } from '../pricing/pricing.service';
import { HotelService } from './hotel.service';
import { RoomTypeService } from './room-type.service';
import { HotelPublishChecks } from './hotel-publish.checks';
import { Hotel, HotelDocument, HotelSchema, HotelStatus, CancellationFeeBasis } from './schemas/hotel.schema';
import { RoomType, RoomTypeDocument, RoomTypeSchema, RoomTypeStatus } from './schemas/room-type.schema';

jest.setTimeout(120_000);

describe('Hotel Lifecycle Integration: Add Hotel -> Add Room Type -> Add Base Rate -> Publish Hotel', () => {
  let replicaSet: MongoMemoryReplSet;
  let connection: Connection;
  let hotelModel: Model<HotelDocument>;
  let roomTypeModel: Model<RoomTypeDocument>;
  let baseRateModel: Model<BaseRateDocument>;
  let inventoryModel: Model<NightInventoryDocument>;
  let auditModel: Model<AuditLogDocument>;

  let hotels: HotelService;
  let roomTypes: RoomTypeService;
  let pricing: PricingService;
  let inventory: InventoryService;

  const actor: StaffPrincipal = {
    id: new Types.ObjectId().toString(),
    audience: 'STAFF',
    status: 'ACTIVE',
    role: 'SUPER_ADMIN',
    permissions: [
      'hotels.view',
      'hotels.create',
      'hotels.edit',
      'hotels.publish',
      'hotels.suspend',
      'rooms.view',
      'rooms.create',
      'rooms.edit',
      'rates.view',
      'rates.edit',
      'inventory.view',
      'inventory.edit',
    ],
    hotelIds: [],
  };

  beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1, name: 'staywise-lifecycle-rs' } });
    connection = await mongoose.createConnection(replicaSet.getUri()).asPromise();

    hotelModel = connection.model(Hotel.name, HotelSchema) as unknown as Model<HotelDocument>;
    roomTypeModel = connection.model(RoomType.name, RoomTypeSchema) as unknown as Model<RoomTypeDocument>;
    baseRateModel = connection.model(BaseRate.name, BaseRateSchema) as unknown as Model<BaseRateDocument>;
    inventoryModel = connection.model(NightInventory.name, NightInventorySchema) as unknown as Model<NightInventoryDocument>;
    auditModel = connection.model(AuditLog.name, AuditLogSchema) as unknown as Model<AuditLogDocument>;

    await Promise.all([
      hotelModel.init(),
      roomTypeModel.init(),
      baseRateModel.init(),
      inventoryModel.init(),
      auditModel.init(),
    ]);

    const audit = new AuditService(auditModel);
    const transactions = new TransactionService(connection);
    const publishChecks = new HotelPublishChecks(roomTypeModel, baseRateModel, inventoryModel);

    inventory = new InventoryService(inventoryModel, roomTypeModel, audit, transactions);
    pricing = new PricingService(roomTypeModel, baseRateModel, audit, transactions);
    roomTypes = new RoomTypeService(hotelModel, roomTypeModel, audit, transactions, inventory);
    hotels = new HotelService(connection, hotelModel, roomTypeModel, baseRateModel, inventoryModel, audit, transactions, publishChecks);
  });

  beforeEach(async () => {
    await Promise.all([
      hotelModel.deleteMany({}),
      roomTypeModel.deleteMany({}),
      baseRateModel.deleteMany({}),
      inventoryModel.deleteMany({}),
      auditModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await connection?.close();
    await replicaSet?.stop();
  });

  it('completes the entire property onboarding lifecycle: create hotel -> add room type -> set base rate -> initialize inventory -> publish hotel', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const futureDate = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

    // ── STEP 1: Add Hotel (creates DRAFT status with cancellation policy) ──
    const createdHotel = await hotels.create(
      {
        name: 'The Grand Residency Bengaluru',
        slug: 'grand-residency-bengaluru',
        timezone: 'Asia/Kolkata',
        address: {
          line1: '45 Residency Road',
          city: 'Bengaluru',
          postalCode: '560025',
          countryCode: 'IN',
        },
        contact: {
          email: 'admin@grandresidency.example.com',
          phone: '+91 80 2555 1234',
        },
        description: 'Luxury business and leisure hotel located in central Bengaluru.',
        amenities: ['Wifi', 'Pool', 'Gym', 'Spa'],
        cancellationPolicy: {
          effectiveFrom: today,
          freeCancellationHoursBeforeCheckIn: 24,
          afterCutoff: { basis: CancellationFeeBasis.PERCENTAGE_BPS, percentageBps: 5000 },
          noShow: { basis: CancellationFeeBasis.FULL_STAY },
        },
      },
      actor,
    );

    expect(createdHotel).toBeDefined();
    expect(createdHotel.status).toBe(HotelStatus.DRAFT);
    expect(createdHotel.version).toBe(0);
    expect(createdHotel.name).toBe('The Grand Residency Bengaluru');

    const hotelId = createdHotel.id;

    // ── STEP 2: Pre-Flight Gate B5 Check - Should reject publication because no room types exist ──
    await expect(hotels.publish(hotelId, 0, actor)).rejects.toMatchObject({
      response: expect.objectContaining({
        error: 'HOTEL_NOT_READY',
        details: expect.arrayContaining([
          expect.objectContaining({ code: 'HOTEL_ACTIVE_ROOM_TYPES_REQUIRED' }),
        ]),
      }),
    });

    // ── STEP 3: Add Room Type ──
    const createdRoomType = await roomTypes.create(
      hotelId,
      {
        name: 'Deluxe Suite',
        code: 'DLX-STE',
        maxAdults: 2,
        maxChildren: 1,
        totalRooms: 10,
        description: 'Spacious suite with king bed and city view',
        amenities: ['Wifi', 'King Bed', 'AC', 'Bathtub'],
      },
      actor,
    );

    expect(createdRoomType).toBeDefined();
    expect(createdRoomType.status).toBe(RoomTypeStatus.ACTIVE);
    expect(createdRoomType.hotelId.toString()).toBe(hotelId);
    expect(createdRoomType.totalRooms).toBe(10);
    expect(createdRoomType.version).toBe(0);

    const roomTypeId = createdRoomType.id;

    // ── STEP 4: Pre-Flight Gate B5 Check - Should reject publication because base rate is missing ──
    await expect(hotels.publish(hotelId, 0, actor)).rejects.toMatchObject({
      response: expect.objectContaining({
        error: 'HOTEL_NOT_READY',
        details: expect.arrayContaining([
          expect.objectContaining({ code: 'HOTEL_BASE_RATES_REQUIRED' }),
        ]),
      }),
    });

    // ── STEP 5: Set Base Rate for the Room Type ──
    const createdRate = await pricing.setBaseRate(
      roomTypeId,
      {
        amountMinorUnits: 750000, // ₹7,500.00
        currency: 'INR',
        reason: 'Initial rack rate setup for deluxe suite',
      },
      actor,
    );

    expect(createdRate).toBeDefined();
    expect(createdRate.amountMinorUnits).toBe(750000);
    expect(createdRate.currency).toBe('INR');
    expect(createdRate.version).toBe(0);

    // ── STEP 6: Pre-Flight Gate B5 Check - Should reject publication because future inventory is missing ──
    await expect(hotels.publish(hotelId, 0, actor)).rejects.toMatchObject({
      response: expect.objectContaining({
        error: 'HOTEL_NOT_READY',
        details: expect.arrayContaining([
          expect.objectContaining({ code: 'HOTEL_FUTURE_INVENTORY_REQUIRED' }),
        ]),
      }),
    });

    // ── STEP 7: Initialize Future Inventory (14 days) ──
    const inventoryInitResult = await inventory.initialize(
      roomTypeId,
      { from: today, to: futureDate },
      actor,
    );

    expect(inventoryInitResult.createdNights).toBeGreaterThanOrEqual(14);

    // Verify inventory documents exist in database
    const invCount = await inventoryModel.countDocuments({
      roomTypeId: createdRoomType._id,
      stayDate: { $gte: today, $lt: futureDate },
      total: 10,
    });
    expect(invCount).toBeGreaterThanOrEqual(14);

    // ── STEP 8: Publish Hotel (Gate B5 passed!) ──
    const publishedHotel = await hotels.publish(hotelId, 0, actor);

    expect(publishedHotel).toBeDefined();
    expect(publishedHotel.status).toBe(HotelStatus.PUBLISHED);
    expect(publishedHotel.version).toBe(1);

    // Verify audit log for hotel.publish
    const publishAudit = await auditModel.findOne({
      action: 'hotel.publish',
      resourceId: hotelId,
    });
    expect(publishAudit).not.toBeNull();
    expect(publishAudit?.outcome).toBe('SUCCESS');

    // ── STEP 9: Suspend and Reactivate Cycle ──
    const suspendedHotel = await hotels.setStatus(
      hotelId,
      HotelStatus.SUSPENDED,
      1,
      actor,
      'Seasonal temporary closure for maintenance',
    );
    expect(suspendedHotel.status).toBe(HotelStatus.SUSPENDED);
    expect(suspendedHotel.version).toBe(2);

    // Reactivate: Publish from SUSPENDED back to PUBLISHED
    const reactivatedHotel = await hotels.publish(hotelId, 2, actor);
    expect(reactivatedHotel.status).toBe(HotelStatus.PUBLISHED);
    expect(reactivatedHotel.version).toBe(3);
  });
});
