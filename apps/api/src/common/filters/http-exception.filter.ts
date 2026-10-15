import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle Mongo duplicate key errors (code 11000)
    if ((exception as any)?.name === 'MongoServerError' && (exception as any)?.code === 11000) {
      const mongoErr = exception as any;
      const keys = Object.keys(mongoErr.keyPattern ?? {});
      const field = keys.includes('normalizedCode') ? 'code' : keys.find((k: string) => k !== 'hotelId') ?? keys[0] ?? 'field';
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        errorCode: 'DUPLICATE',
        message: `${field} is already in use`,
        errors: [{ field, message: `This ${field} is already in use` }],
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let errors: unknown = undefined;
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as string | Record<string, any>;
      const obj = typeof body === 'string' ? { message: body } : body;

      errorCode = typeof obj.error === 'string' && /^[A-Z0-9_]+$/.test(obj.error)
        ? obj.error
        : (HttpStatus[status] ? String(HttpStatus[status]).toUpperCase() : 'HTTP_ERROR');

      message = Array.isArray(obj.message) ? obj.message.join('; ') : (obj.message ?? 'Request failed');
      errors = obj.errors;
      details = obj.details;
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      ...(errors ? { errors } : {}),
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
