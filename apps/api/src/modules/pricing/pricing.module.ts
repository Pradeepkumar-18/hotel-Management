import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RoomType, RoomTypeSchema } from '../hotels/schemas/room-type.schema';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { BaseRate, BaseRateSchema } from './schemas/base-rate.schema';

@Module({
  imports: [AuthModule, MongooseModule.forFeature([
    { name: RoomType.name, schema: RoomTypeSchema },
    { name: BaseRate.name, schema: BaseRateSchema },
  ])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}

