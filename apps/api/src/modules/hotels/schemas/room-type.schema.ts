import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoomTypeDocument = HydratedDocument<RoomType>;

export enum RoomTypeStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

@Schema({ _id: false })
export class BedConfiguration {
  @Prop({ required: true, trim: true, maxlength: 40 })
  type: string;

  @Prop({ required: true, min: 1, max: 20 })
  quantity: number;
}

export const BedConfigurationSchema = SchemaFactory.createForClass(BedConfiguration);

@Schema({ timestamps: true, collection: 'room_types' })
export class RoomType {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotelId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true, maxlength: 32 })
  code: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 32 })
  normalizedCode: string;

  @Prop({ trim: true, maxlength: 3000 })
  description?: string;

  @Prop({ required: true, min: 1, max: 30 })
  maxAdults: number;

  @Prop({ required: true, min: 0, max: 30, default: 0 })
  maxChildren: number;

  @Prop({ type: [BedConfigurationSchema], default: [] })
  beds: BedConfiguration[];

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ required: true, min: 0, max: 10000 })
  totalRooms: number;

  @Prop({ enum: Object.values(RoomTypeStatus), default: RoomTypeStatus.ACTIVE, required: true })
  status: RoomTypeStatus;

  @Prop({ required: true, default: 0, min: 0 })
  version: number;

  @Prop({ required: true, default: 0, min: 0 })
  inventoryRevision: number;

  createdAt: Date;
  updatedAt: Date;
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
RoomTypeSchema.index({ hotelId: 1, normalizedCode: 1 }, { unique: true, name: 'room_type_hotel_code_unique' });
RoomTypeSchema.index({ hotelId: 1, status: 1 }, { name: 'room_type_hotel_status' });
