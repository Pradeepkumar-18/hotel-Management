import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Checks whether the current MongoDB connection is part of a replica set
   */
  async isReplicaSet(): Promise<boolean> {
    try {
      if (!this.connection.db) {
        return false;
      }
      const adminDb = this.connection.db.admin();
      const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
      return status !== null && status.ok === 1;
    } catch {
      return false;
    }
  }

  /**
   * Executes a callback within a MongoDB multi-document transaction.
   * Multi-document transactions require replica set topology per AGENT.md.
   */
  async executeInTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    const session = await this.connection.startSession();
    let attempt = 0;

    try {
      while (attempt < maxRetries) {
        attempt++;
        try {
          let result: T;
          await session.withTransaction(async () => {
            result = await operation(session);
          });
          return result!;
        } catch (error: any) {
          const isTransient =
            error?.hasErrorLabel?.('TransientTransactionError') ||
            error?.message?.includes('WriteConflict');

          if (isTransient && attempt < maxRetries) {
            this.logger.warn(
              `Transient transaction error on attempt ${attempt}/${maxRetries}. Retrying... Reason: ${error.message}`,
            );
            await new Promise((resolve) => setTimeout(resolve, 50 * Math.pow(2, attempt)));
            continue;
          }
          throw error;
        }
      }
      throw new Error(`Transaction failed after ${maxRetries} attempts`);
    } finally {
      await session.endSession();
    }
  }
}
