import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../../auth/types/authenticated-request';
import {
  RATE_LIMIT_CATEGORY_KEY,
} from './rate-limit.decorator';
import { RateLimitCategory } from './rate-limit-category';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const category =
      this.reflector.getAllAndOverride<RateLimitCategory>(
        RATE_LIMIT_CATEGORY_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!category) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<
        Request & Partial<AuthenticatedRequest>
      >();

    const response =
      context.switchToHttp().getResponse<Response>();

    const windowSeconds = this.getPositiveInteger(
      'RATE_LIMIT_WINDOW_SECONDS',
      60,
    );

    this.enforceIpLimit(
      request,
      response,
      category,
      windowSeconds,
    );

    if (request.user?.id) {
      this.enforceUserLimit(
        request.user.id,
        response,
        category,
        windowSeconds,
      );
    }

    return true;
  }

  private enforceIpLimit(
    request: Request,
    response: Response,
    category: RateLimitCategory,
    windowSeconds: number,
  ): void {
    const limit = this.getIpLimit(category);

    const key = this.rateLimitService.buildKey(
      category,
      'ip',
      request.ip ?? 'unknown',
    );

    const result = this.rateLimitService.consume(
      key,
      limit,
      windowSeconds,
    );

    if (!result.allowed) {
      response.setHeader(
        'Retry-After',
        result.retryAfterSeconds,
      );

      throw new HttpException(
        'Too many requests from this IP address',
        HttpStatus.TOO_MANY_REQUESTS,
    );
    }
  }

  private enforceUserLimit(
    userId: string,
    response: Response,
    category: RateLimitCategory,
    windowSeconds: number,
  ): void {
    const limit = this.getUserLimit(category);

    if (limit === null) {
      return;
    }

    const key = this.rateLimitService.buildKey(
      category,
      'user',
      userId,
    );

    const result = this.rateLimitService.consume(
      key,
      limit,
      windowSeconds,
    );

    if (!result.allowed) {
      response.setHeader(
        'Retry-After',
        result.retryAfterSeconds,
      );

      throw new HttpException(
        'Too many requests for this user',
         HttpStatus.TOO_MANY_REQUESTS,
    );
    }
  }

  private getIpLimit(
    category: RateLimitCategory,
  ): number {
    switch (category) {
      case RateLimitCategory.AUTH:
        return this.getPositiveInteger(
          'RATE_LIMIT_AUTH_IP',
          20,
        );

      case RateLimitCategory.CHAT:
        return this.getPositiveInteger(
          'RATE_LIMIT_CHAT_IP',
          30,
        );

      case RateLimitCategory.SUBSCRIPTIONS:
        return this.getPositiveInteger(
          'RATE_LIMIT_SUBSCRIPTIONS_IP',
          20,
        );
    }
  }

  private getUserLimit(
    category: RateLimitCategory,
  ): number | null {
    switch (category) {
      case RateLimitCategory.AUTH:
        return null;

      case RateLimitCategory.CHAT:
        return this.getPositiveInteger(
          'RATE_LIMIT_CHAT_USER',
          20,
        );

      case RateLimitCategory.SUBSCRIPTIONS:
        return this.getPositiveInteger(
          'RATE_LIMIT_SUBSCRIPTIONS_USER',
          10,
        );
    }
  }

  private getPositiveInteger(
    environmentVariable: string,
    fallback: number,
  ): number {
    const parsed = Number(
      process.env[environmentVariable],
    );

    return Number.isInteger(parsed) && parsed > 0
      ? parsed
      : fallback;
  }
}