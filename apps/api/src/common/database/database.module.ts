import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransactionService } from './transaction.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        autoIndex: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TransactionService],
  exports: [MongooseModule, TransactionService],
})
export class DatabaseModule {}
