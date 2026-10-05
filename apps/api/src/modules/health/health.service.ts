import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { TransactionService } from '../../common/database/transaction.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly transactionService: TransactionService,
  ) {}

  async check() {
    const isDbConnected = this.connection.readyState === 1;
    const isReplicaSet = await this.transactionService.isReplicaSet();

    return {
      status: isDbConnected ? 'ok' : 'degraded',
      service: 'staywise-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        connected: isDbConnected,
        readyState: this.connection.readyState,
        replicaSetEnabled: isReplicaSet,
      },
    };
  }
}
