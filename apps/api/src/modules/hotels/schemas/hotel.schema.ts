import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HotelDocument = HydratedDocument<Hotel>;

export enum HotelStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

@Schema({ _id: false })
export class HotelAddress {
  @Prop({ required: true, trim: true, maxlength: 240 })
  line1: string;

  @Prop({ trim: true, maxlength: 240 })
  line2?: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  city: string;

  @Prop({ trim: true, maxlength: 120 })
  region?: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  postalCode: string;

  @Prop({ required: true, trim: true, uppercase: true, minlength: 2, maxlength: 2 })
  countryCode: string;
}

export const HotelAddressSchema = SchemaFactory.createForClass(HotelAddress);

@Schema({ _id: false })
export class HotelContact {
  @Prop({ trim: true, lowercase: true, maxlength: 254 })
  email?: string;

  @Prop({ trim: true, maxlength: 32 })
  phone?: string;
}

export const HotelContactSchema = SchemaFactory.createForClass(HotelContact);

@Schema({ _id: false })
export class HotelCoordinates {
  @Prop({ required: true, min: -90, max: 90 })
  latitude: number;

  @Prop({ required: true, min: -180, max: 180 })
  longitude: number;
}

export const HotelCoordinatesSchema = SchemaFactory.createForClass(HotelCoordinates);

export enum CancellationFeeBasis {
  NO_FEE = 'NO_FEE',
  FULL_STAY = 'FULL_STAY',
  FIXED_MINOR_UNITS = 'FIXED_MINOR_UNITS',
  PERCENTAGE_BPS = 'PERCENTAGE_BPS',
}

@Schema({ _id: false })
export class CancellationFeeRule {
  @Prop({ required: true, enum: Object.values(CancellationFeeBasis) })
  basis: CancellationFeeBasis;

  @Prop({ min: 0, max: 9000000000000 })
  amountMinorUnits?: number;

  @Prop({ uppercase: true, match: /^[A-Z]{3}$/ })
  currency?: string;

  @Prop({ min: 0, max: 10000 })
  percentageBps?: number;
}

export const CancellationFeeRuleSchema = SchemaFactory.createForClass(CancellationFeeRule);

@Schema({ _id: false })
export class HotelCancellationPolicy {
  @Prop({ required: true, match: /^\d{4}-\d{2}-\d{2}$/ })
  effectiveFrom: string;

  @Prop({ required: true, min: 0, max: 8760 })
  freeCancellationHoursBeforeCheckIn: number;

  @Prop({ type: CancellationFeeRuleSchema, required: true })
  afterCutoff: CancellationFeeRule;

  @Prop({ type: CancellationFeeRuleSchema, required: true })
  noShow: CancellationFeeRule;

  @Prop({ required: true, min: 1, default: 1 })
  version: number;
}

export const HotelCancellationPolicySchema = SchemaFactory.createForClass(HotelCancellationPolicy);

@Schema({ timestamps: true, collection: 'hotels', optimisticConcurrency: false })
export class Hotel {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 140 })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 160 })
  slug: string;

  @Prop({ type: HotelAddressSchema, required: true })
  address: HotelAddress;

  @Prop({ required: true, trim: true, maxlength: 100 })
  timezone: string;

  @Prop({ type: HotelContactSchema, required: true })
  contact: HotelContact;

  @Prop({ type: HotelCoordinatesSchema })
  coordinates?: HotelCoordinates;

  @Prop({ trim: true, maxlength: 5000 })
  description?: string;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: HotelCancellationPolicySchema })
  cancellationPolicy?: HotelCancellationPolicy;

  @Prop({ enum: Object.values(HotelStatus), default: HotelStatus.DRAFT, required: true })
  status: HotelStatus;

  @Prop({ required: true, default: 0, min: 0 })
  version: number;

  createdAt: Date;
  updatedAt: Date;
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);
HotelSchema.index({ slug: 1 }, { unique: true, name: 'hotel_slug_unique' });
HotelSchema.index({ status: 1, 'address.city': 1 }, { name: 'hotel_status_city' });
