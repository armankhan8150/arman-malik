import { RateLimitGuard } from '../../common/security/rate-limit/rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit/rate-limit.decorator';
import { RateLimitCategory } from '../../common/security/rate-limit/rate-limit-category';

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request';
import { CancelSubscriptionUseCase } from '../application/cancel-subscription.use-case';
import { CreateSubscriptionUseCase } from '../application/create-subscription.use-case';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
@UseGuards(
  AuthenticationGuard,
  RateLimitGuard,
)
@RateLimit(RateLimitCategory.SUBSCRIPTIONS)
export class SubscriptionsController {
  constructor(
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
  ) {}

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateSubscriptionDto,
  ) {
    return this.createSubscriptionUseCase.execute({
      userId: request.user.id,
      tier: body.tier,
      billingCycle: body.billingCycle,
      autoRenew: body.autoRenew,
    });
  }

  @Delete(':subscriptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Req() request: AuthenticatedRequest,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<void> {
    await this.cancelSubscriptionUseCase.execute({
      subscriptionId,
      requesterId: request.user.id,
      requesterRole: request.user.role,
    });
  }
}