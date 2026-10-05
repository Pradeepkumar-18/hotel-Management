import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BaseRateDocument = HydratedDocument<BaseRate>;

@Schema({ timestamps: true, collection: 'base_rates' })
export class BaseRate {
  @Prop({ type: Types.ObjectId, ref: 'RoomType', required: true })
  roomTypeId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 9000000000000 })
  amountMinorUnits: number;

  @Prop({ required: true, uppercase: true, match: /^[A-Z]{3}$/ })
  currency: string;

  @Prop({ required: true, default: 0, min: 0 })
  version: number;
}

export const BaseRateSchema = SchemaFactory.createForClass(BaseRate);
BaseRateSchema.index({ roomTypeId: 1 }, { unique: true, name: 'base_rate_room_type_unique' });

