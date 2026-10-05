import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NightInventoryDocument = HydratedDocument<NightInventory>;

@Schema({ timestamps: true, collection: 'night_inventory' })
export class NightInventory {
  @Prop({ type: Types.ObjectId, ref: 'RoomType', required: true })
  roomTypeId: Types.ObjectId;

  @Prop({ required: true, match: /^\d{4}-\d{2}-\d{2}$/ })
  stayDate: string;

  @Prop({ required: true, min: 0, max: 10000 })
  total: number;

  @Prop({ required: true, default: 0, min: 0, max: 10000 })
  blocked: number;

  @Prop({ required: true, default: 0, min: 0, max: 10000 })
  held: number;

  @Prop({ required: true, default: 0, min: 0, max: 10000 })
  confirmed: number;

  @Prop({ required: true, default: 0, min: 0 })
  version: number;
}

export const NightInventorySchema = SchemaFactory.createForClass(NightInventory);
NightInventorySchema.index(
  { roomTypeId: 1, stayDate: 1 },
  { unique: true, name: 'night_inventory_room_date_unique' },
);
NightInventorySchema.index({ stayDate: 1, roomTypeId: 1 }, { name: 'night_inventory_date_room' });

