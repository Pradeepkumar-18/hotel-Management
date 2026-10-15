import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const conn = app.get<Connection>(getConnectionToken());

  console.log('Ensuring MongoDB indexes across all models...');
  for (const model of Object.values(conn.models)) {
    await model.createIndexes();
    console.log(`Indexes verified: ${model.modelName}`);
  }

  await app.close();
  console.log('Index synchronization completed successfully.');
}

bootstrap().catch((err) => {
  console.error('Failed to ensure indexes:', err);
  process.exit(1);
});
