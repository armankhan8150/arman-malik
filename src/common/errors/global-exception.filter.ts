import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from './domain.error';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

interface HttpLikeError {
  status?: number;
  statusCode?: number;
  type?: string;
  message?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const errorResponse = this.mapException(exception);

    response.status(errorResponse.statusCode).json({
      ...errorResponse,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private mapException(
    exception: unknown,
  ): Omit<ErrorResponse, 'timestamp' | 'path'> {
    if (exception instanceof DomainError) {
      return this.mapDomainError(exception);
    }

    if (exception instanceof HttpException) {
      return this.mapHttpException(exception);
    }

    if (this.isPayloadTooLargeError(exception)) {
      return {
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds the allowed size',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  private mapDomainError(
    exception: DomainError,
  ): Omit<ErrorResponse, 'timestamp' | 'path'> {
    const statusCode = this.getDomainErrorStatus(
      exception.code,
    );

    return {
      statusCode,
      code: exception.code,
      message: exception.message,
    };
  }

  private getDomainErrorStatus(code: string): number {
    switch (code) {
      case 'QUOTA_EXCEEDED':
        return HttpStatus.TOO_MANY_REQUESTS;

      case 'FORBIDDEN':
        return HttpStatus.FORBIDDEN;

      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;

      case 'INACTIVE_SUBSCRIPTION':
      case 'SUBSCRIPTION_NOT_RENEWABLE':
        return HttpStatus.CONFLICT;

      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private mapHttpException(
    exception: HttpException,
  ): Omit<ErrorResponse, 'timestamp' | 'path'> {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        code: this.getHttpErrorCode(statusCode),
        message: exceptionResponse,
      };
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseObject = exceptionResponse as {
        message?: string | string[];
      };

      return {
        statusCode,
        code: this.getHttpErrorCode(statusCode),
        message:
          responseObject.message ?? exception.message,
      };
    }

    return {
      statusCode,
      code: this.getHttpErrorCode(statusCode),
      message: exception.message,
    };
  }

  private getHttpErrorCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.REQUEST_TIMEOUT:
        return 'REQUEST_TIMEOUT';

      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'PAYLOAD_TOO_LARGE';

      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';

      default:
        return `HTTP_${statusCode}`;
    }
  }

  private isPayloadTooLargeError(
    exception: unknown,
  ): boolean {
    if (
      typeof exception !== 'object' ||
      exception === null
    ) {
      return false;
    }

    const error = exception as HttpLikeError;

    return (
      error.status === HttpStatus.PAYLOAD_TOO_LARGE ||
      error.statusCode === HttpStatus.PAYLOAD_TOO_LARGE ||
      error.type === 'entity.too.large'
    );
  }
}