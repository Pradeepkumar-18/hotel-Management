import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: String, default: null })
  actorId?: string;

  @Prop({ type: String, required: true, enum: ['STAFF', 'GUEST', 'SYSTEM'] })
  actorType: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String, required: true })
  resourceType: string;

  @Prop({ type: String, required: true })
  resourceId: string;

  @Prop({ type: String, default: null })
  hotelId?: string;

  @Prop({ type: String, required: true, enum: ['SUCCESS', 'FAILURE'] })
  outcome: string;

  @Prop({ type: String, default: null })
  reason?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: String, default: null })
  ipAddressPrefix?: string;

  @Prop({ type: String, default: null })
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ hotelId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
