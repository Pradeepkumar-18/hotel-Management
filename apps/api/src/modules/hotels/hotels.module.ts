import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PricingModule } from '../pricing/pricing.module';
import { BaseRate, BaseRateSchema } from '../pricing/schemas/base-rate.schema';
import { NightInventory, NightInventorySchema } from '../inventory/schemas/night-inventory.schema';
import { Hotel, HotelSchema } from './schemas/hotel.schema';
import { RoomType, RoomTypeSchema } from './schemas/room-type.schema';
import { HotelService } from './hotel.service';
import { RoomTypeService } from './room-type.service';
import { AdminHotelsController, PublicHotelsController } from './hotels.controller';
import { AdminRoomTypesController } from './room-types.controller';

@Module({
  imports: [AuthModule, InventoryModule, PricingModule, MongooseModule.forFeature([
    { name: Hotel.name, schema: HotelSchema },
    { name: RoomType.name, schema: RoomTypeSchema },
    { name: BaseRate.name, schema: BaseRateSchema },
    { name: NightInventory.name, schema: NightInventorySchema },
  ])],
  controllers: [AdminHotelsController, PublicHotelsController, AdminRoomTypesController],
  providers: [HotelService, RoomTypeService],
  exports: [HotelService, RoomTypeService],
})
export class HotelsModule {}
