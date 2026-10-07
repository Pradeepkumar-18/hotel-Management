import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  private standaloneWarningLogged = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Optional() private readonly nodeEnv?: string,
  ) {}

  /**
   * Checks whether the current MongoDB connection is part of a replica set
   */
  async isReplicaSet(): Promise<boolean> {
    try {
      if (!this.connection.db) {
        return false;
      }
      const hello = await this.connection.db.admin().command({ hello: 1 });
      return typeof hello.setName === 'string' && hello.setName.length > 0;
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
      if (!this.connection.db) throw new Error('MongoDB connection is not ready');
      const hello = await this.connection.db.admin().command({ hello: 1 });
      if (typeof hello.setName !== 'string' || hello.setName.length === 0) {
        if ((this.nodeEnv || process.env.NODE_ENV) !== 'development') {
          throw new Error('MongoDB replica-set topology is required for transaction-backed operations outside local development');
        }
        if (!this.standaloneWarningLogged) {
          this.logger.warn('Standalone MongoDB detected: local development writes are running without transactions; atomicity and inventory concurrency guarantees are disabled');
          this.standaloneWarningLogged = true;
        }
        return await operation(session);
      }

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
