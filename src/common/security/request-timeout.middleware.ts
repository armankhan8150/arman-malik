import {
  Injectable,
  NestMiddleware,
  RequestTimeoutException,
} from '@nestjs/common';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

@Injectable()
export class RequestTimeoutMiddleware
  implements NestMiddleware
{
  use(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const configuredTimeout = Number(
      process.env.REQUEST_TIMEOUT_MS ?? 10000,
    );

    const timeoutMs =
      Number.isFinite(configuredTimeout) &&
      configuredTimeout > 0
        ? configuredTimeout
        : 10000;

    const timeout = setTimeout(() => {
      if (!response.headersSent) {
        next(
          new RequestTimeoutException(
            'Request processing timed out',
          ),
        );
      }
    }, timeoutMs);

    response.on('finish', () => {
      clearTimeout(timeout);
    });

    response.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  }
}