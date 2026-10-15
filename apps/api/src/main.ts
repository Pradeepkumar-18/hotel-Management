import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { flattenValidationErrors } from './common/validation/flatten-validation-errors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const apiPrefix = configService.get<string>('apiPrefix', '/api/v1');
  const corsOrigins = configService.get<string[]>('corsOrigins', []);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.use('/uploads', express.static(resolve(process.cwd(), 'uploads')));

  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const effectiveOrigins =
    corsOrigins.length > 0
      ? corsOrigins
      : nodeEnv === 'production'
        ? []
        : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  if (nodeEnv === 'production' && effectiveOrigins.length === 0) {
    throw new Error('FATAL: CORS_ORIGINS must be explicitly configured in production environments.');
  }

  app.enableCors({
    origin: effectiveOrigins,
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) =>
        new BadRequestException({
          error: 'VALIDATION_FAILED',
          message: 'Some fields are invalid',
          errors: flattenValidationErrors(errors),
        }),
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Staywise Hotel Platform API')
    .setDescription('Modular REST API for hotel booking, room availability, and operations management')
    .setVersion('1.0.0')
    .addCookieAuth('staywise_staff_sid', {
      type: 'apiKey',
      in: 'cookie',
      name: 'staywise_staff_sid',
      description: 'Staff session cookie',
    })
    .addCookieAuth('staywise_guest_sid', {
      type: 'apiKey',
      in: 'cookie',
      name: 'staywise_guest_sid',
      description: 'Guest session cookie',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`Staywise API is running on: http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
  logger.log(`OpenAPI documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
