import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class JsonContentTypeMiddleware implements NestMiddleware {
  use(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void {
    const methodsRequiringJson = ['POST', 'PUT', 'PATCH'];

    if (!methodsRequiringJson.includes(request.method)) {
      next();
      return;
    }

    if (!request.is('application/json')) {
      throw new BadRequestException(
        'Content-Type must be application/json',
      );
    }

    next();
  }
}