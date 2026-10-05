import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StaffMembershipDocument = HydratedDocument<StaffMembership>;

@Schema({ timestamps: true, collection: 'staff_memberships' })
export class StaffMembership {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Role', default: [] })
  roleIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Hotel', default: [] })
  hotelIds: Types.ObjectId[];

  @Prop({ required: true, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' })
  status: 'ACTIVE' | 'SUSPENDED';
}

export const StaffMembershipSchema = SchemaFactory.createForClass(StaffMembership);
StaffMembershipSchema.index({ userId: 1 }, { unique: true, name: 'staff_membership_user_unique' });
