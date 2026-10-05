import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true, lowercase: true, maxlength: 254 })
  normalizedEmail: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, enum: ['STAFF', 'GUEST'] })
  accountType: 'STAFF' | 'GUEST';

  @Prop({ required: true, enum: Object.values(UserStatus), default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ required: true, default: 0, min: 0 })
  failedLoginCount: number;

  @Prop({ type: Date, default: null })
  lockUntil?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ normalizedEmail: 1 }, { unique: true, name: 'user_normalized_email_unique' });
UserSchema.index({ accountType: 1, status: 1 }, { name: 'user_type_status' });
