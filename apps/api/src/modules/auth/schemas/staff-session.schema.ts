import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StaffSessionDocument = HydratedDocument<StaffSession>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'staff_sessions' })
export class StaffSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['STAFF'], default: 'STAFF' })
  audience: 'STAFF';

  @Prop({ required: true, select: false })
  tokenHash: string;

  @Prop({ required: true, default: Date.now })
  lastSeenAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt?: Date;

  @Prop({ type: String, default: null })
  revokeReason?: string;

  @Prop({ type: String, maxlength: 64, default: null })
  ipAddressPrefix?: string;

  @Prop({ type: String, maxlength: 200, default: null })
  userAgentSummary?: string;
}

export const StaffSessionSchema = SchemaFactory.createForClass(StaffSession);
StaffSessionSchema.index({ tokenHash: 1 }, { unique: true, name: 'staff_session_token_hash_unique' });
StaffSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 }, { name: 'staff_session_user_active' });
StaffSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'staff_session_expiry_ttl' });
