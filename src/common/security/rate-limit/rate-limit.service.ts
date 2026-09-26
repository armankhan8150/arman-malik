import { Injectable } from '@nestjs/common';
import { RateLimitCategory } from './rate-limit-category';

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

@Injectable()
export class RateLimitService {
  private readonly entries = new Map<
    string,
    RateLimitEntry
  >();

  consume(
    key: string,
    limit: number,
    windowSeconds: number,
    now: number = Date.now(),
  ): RateLimitResult {
    const existing = this.entries.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.entries.set(key, {
        count: 1,
        expiresAt: now + windowSeconds * 1000,
      });

      return {
        allowed: true,
        retryAfterSeconds: windowSeconds,
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(
            (existing.expiresAt - now) / 1000,
          ),
        ),
      };
    }

    existing.count += 1;

    return {
      allowed: true,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (existing.expiresAt - now) / 1000,
        ),
      ),
    };
  }

  buildKey(
    category: RateLimitCategory,
    dimension: 'ip' | 'user',
    identifier: string,
  ): string {
    return `${category}:${dimension}:${identifier}`;
  }
}