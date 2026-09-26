import { SetMetadata } from '@nestjs/common';
import { RateLimitCategory } from './rate-limit-category';

export const RATE_LIMIT_CATEGORY_KEY =
  'rate-limit-category';

export const RateLimit = (
  category: RateLimitCategory,
): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_CATEGORY_KEY, category);