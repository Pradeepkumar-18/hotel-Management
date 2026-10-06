import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import configuration from './common/config/configuration';
import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(__dirname, '../../../.env'), resolve(process.cwd(), '.env')],
      load: [configuration],
    }),
    DatabaseModule,
    HealthModule,
    AuditModule,
    AuthModule,
    HotelsModule,
  ],
})
export class AppModule {}
