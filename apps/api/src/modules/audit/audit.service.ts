import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface RecordAuditParams {
  actorId?: string;
  actorType: 'STAFF' | 'GUEST' | 'SYSTEM';
  action: string;
  resourceType: string;
  resourceId: string;
  hotelId?: string;
  outcome: 'SUCCESS' | 'FAILURE';
  reason?: string;
  metadata?: Record<string, any>;
  ipAddressPrefix?: string;
  userAgent?: string;
  session?: ClientSession;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(params: RecordAuditParams): Promise<AuditLogDocument> {
    try {
      const sanitizedMetadata = this.sanitizeMetadata(params.metadata);
      const auditEntry = new this.auditLogModel({
        ...params,
        metadata: sanitizedMetadata,
      });

      if (params.session) {
        return await auditEntry.save({ session: params.session });
      }
      return await auditEntry.save();
    } catch (error: any) {
      this.logger.error(`Failed to record audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {};
    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'token', 'secret', 'cardNumber', 'cvv', 'authorization'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
