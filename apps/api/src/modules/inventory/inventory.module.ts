import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RoomType, RoomTypeSchema } from '../hotels/schemas/room-type.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { NightInventory, NightInventorySchema } from './schemas/night-inventory.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: NightInventory.name, schema: NightInventorySchema },
      { name: RoomType.name, schema: RoomTypeSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
