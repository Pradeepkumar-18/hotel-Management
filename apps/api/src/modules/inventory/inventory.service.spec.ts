import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Connection, Model, Types } from 'mongoose';
import { AuditLog, AuditLogSchema, AuditLogDocument } from '../audit/schemas/audit-log.schema';
import { AuditService } from '../audit/audit.service';
import { TransactionService } from '../../common/database/transaction.service';
import { StaffPrincipal } from '../../common/auth/staff-permission.guard';
import { Hotel, HotelDocument, HotelSchema } from '../hotels/schemas/hotel.schema';
import { RoomType, RoomTypeDocument, RoomTypeSchema } from '../hotels/schemas/room-type.schema';
import { RoomTypeService } from '../hotels/room-type.service';
import { InventoryAdjustmentDto, InventoryRangeDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';
import { NightInventory, NightInventoryDocument, NightInventorySchema } from './schemas/night-inventory.schema';

jest.setTimeout(120_000);

describe('Inventory and room-count integration', () => {
  let replicaSet: MongoMemoryReplSet;
  let connection: Connection;
  let hotelModel: Model<HotelDocument>;
  let roomTypeModel: Model<RoomTypeDocument>;
  let inventoryModel: Model<NightInventoryDocument>;
  let auditModel: Model<AuditLogDocument>;
  let inventoryService: InventoryService;
  let roomTypeService: RoomTypeService;

  const actor: StaffPrincipal = {
    id: new Types.ObjectId().toString(),
    audience: 'STAFF',
    status: 'ACTIVE',
    role: 'SUPER_ADMIN',
    permissions: ['inventory.view', 'inventory.adjust', 'inventory.block', 'room_types.edit'],
    hotelIds: [],
  };

  beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1, name: 'staywise-test-rs' } });
    connection = await mongoose.createConnection(replicaSet.getUri()).asPromise();
    hotelModel = connection.model(Hotel.name, HotelSchema) as unknown as Model<HotelDocument>;
    roomTypeModel = connection.model(RoomType.name, RoomTypeSchema) as unknown as Model<RoomTypeDocument>;
    inventoryModel = connection.model(NightInventory.name, NightInventorySchema) as unknown as Model<NightInventoryDocument>;
    auditModel = connection.model(AuditLog.name, AuditLogSchema) as unknown as Model<AuditLogDocument>;
    await Promise.all([hotelModel.init(), roomTypeModel.init(), inventoryModel.init(), auditModel.init()]);

    const auditService = new AuditService(auditModel);
    const transactionService = new TransactionService(connection);
    inventoryService = new InventoryService(inventoryModel, roomTypeModel, auditService, transactionService);
    roomTypeService = new RoomTypeService(hotelModel, roomTypeModel, auditService, transactionService, inventoryService);
  });

  beforeEach(async () => {
    await Promise.all([
      hotelModel.deleteMany({}),
      roomTypeModel.deleteMany({}),
      inventoryModel.deleteMany({}),
      auditModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await connection?.close();
    await replicaSet?.stop();
  });

  async function createRoomType(totalRooms = 5) {
    const hotel = await hotelModel.create({
      name: 'Test Hotel',
      slug: `test-hotel-${new Types.ObjectId().toString().slice(-6)}`,
      address: { line1: '1 Test Street', city: 'Test City', postalCode: '00000', countryCode: 'IN' },
      timezone: 'Asia/Kolkata',
      contact: { email: 'hotel@example.test' },
      status: 'DRAFT',
      version: 0,
    });
    const code = `STD-${new Types.ObjectId().toString().slice(-4)}`;
    const roomType = await roomTypeModel.create({
      hotelId: hotel._id,
      name: 'Standard Room',
      code,
      normalizedCode: code.toLowerCase(),
      maxAdults: 2,
      maxChildren: 1,
      totalRooms,
      status: 'ACTIVE',
      version: 0,
      inventoryRevision: 0,
    });
    return { hotel, roomType };
  }

  const range = (from: string, to: string): InventoryRangeDto => ({ from, to });
  const adjustment = (version: number, quantity: number, reason = 'Maintenance work'): InventoryAdjustmentDto => ({ version, quantity, reason });

  it('initializes each local date once and treats the end date as exclusive', async () => {
    const { roomType } = await createRoomType(4);
    const result = await inventoryService.initialize(roomType.id, range('2026-10-10', '2026-10-13'), actor);
    const repeated = await inventoryService.initialize(roomType.id, range('2026-10-10', '2026-10-13'), actor);
    const calendar = await inventoryService.getCalendar(roomType.id, range('2026-10-10', '2026-10-14'), actor);

    expect(result.createdNights).toBe(3);
    expect(repeated.createdNights).toBe(0);
    expect(calendar.nights.map((night) => night.stayDate)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
    expect(calendar.missingDates).toEqual(['2026-10-13']);
    expect(calendar.nights.every((night) => night.total === 4 && night.available === 4)).toBe(true);
  });

  it('blocks and unblocks rooms with version checks and cannot exceed nightly capacity', async () => {
    const { roomType } = await createRoomType(5);
    await inventoryService.initialize(roomType.id, range('2026-10-10', '2026-10-11'), actor);

    const blocked = await inventoryService.block(roomType.id, '2026-10-10', adjustment(0, 3), actor);
    expect(blocked.blocked).toBe(3);
    expect(blocked.available).toBe(2);

    await expect(inventoryService.block(roomType.id, '2026-10-10', adjustment(1, 3), actor)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVENTORY_UNAVAILABLE' }),
    });
    const afterRejectedBlock = await inventoryModel.findOne({ roomTypeId: roomType._id, stayDate: '2026-10-10' }).lean();
    expect(afterRejectedBlock?.blocked).toBe(3);
    expect(afterRejectedBlock?.version).toBe(1);

    const unblocked = await inventoryService.unblock(roomType.id, '2026-10-10', adjustment(1, 2), actor);
    expect(unblocked.blocked).toBe(1);
    expect(unblocked.available).toBe(4);
  });

  it('rejects a total-room reduction below blocked commitments and rolls back every date', async () => {
    const { hotel, roomType } = await createRoomType(5);
    await inventoryService.initialize(roomType.id, range('2026-10-10', '2026-10-13'), actor);
    await inventoryService.block(roomType.id, '2026-10-11', adjustment(0, 3), actor);

    await expect(roomTypeService.update(roomType.id, {
      version: 0,
      totalRooms: 2,
      reason: 'Reduce contracted inventory',
    }, actor)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVENTORY_CAPACITY_CONFLICT' }),
    });

    let nights = await inventoryModel.find({ roomTypeId: roomType._id }).sort({ stayDate: 1 }).lean();
    expect(nights.map((night) => night.total)).toEqual([5, 5, 5]);

    const updated = await roomTypeService.update(roomType.id, {
      version: 0,
      totalRooms: 3,
      reason: 'Align total with blocked rooms',
    }, actor);
    nights = await inventoryModel.find({ roomTypeId: roomType._id }).sort({ stayDate: 1 }).lean();
    expect(updated.totalRooms).toBe(3);
    expect(nights.map((night) => night.total)).toEqual([3, 3, 3]);
    expect(nights.every((night) => night.blocked + night.held + night.confirmed <= night.total)).toBe(true);
    expect(await hotelModel.exists({ _id: hotel._id })).not.toBeNull();
  });

  it('rejects invalid dates and ranges longer than one year', async () => {
    const { roomType } = await createRoomType();
    await expect(inventoryService.initialize(roomType.id, range('2026-02-30', '2026-03-02'), actor)).rejects.toThrow();
    await expect(inventoryService.initialize(roomType.id, range('2026-01-01', '2027-01-03'), actor)).rejects.toThrow('366');
  });
});
