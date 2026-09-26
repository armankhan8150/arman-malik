import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import { randomUUID } from 'node:crypto';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
  };
}

@Injectable()
export class RequestLoggingMiddleware
  implements NestMiddleware
{
  use(
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
  ): void {
    const startedAt = process.hrtime.bigint();

    const incomingRequestId =
      request.headers['x-request-id'];

    const requestId =
      typeof incomingRequestId === 'string' &&
      incomingRequestId.trim().length > 0
        ? incomingRequestId.trim()
        : randomUUID();

    response.setHeader(
      'x-request-id',
      requestId,
    );

    response.on('finish', () => {
      const finishedAt =
        process.hrtime.bigint();

      const responseTimeMs =
        Number(finishedAt - startedAt) /
        1_000_000;

      console.log(
        JSON.stringify({
          level: 'info',
          event: 'http_request',
          requestId,
          userId:
            request.user?.id ?? null,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          responseTimeMs: Number(
            responseTimeMs.toFixed(2),
          ),
          timestamp:
            new Date().toISOString(),
        }),
      );
    });

    next();
  }
}