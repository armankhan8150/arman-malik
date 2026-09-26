import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExpireSubscriptionsUseCase } from './expire-subscriptions.use-case';
import { RenewSubscriptionsUseCase } from './renew-subscriptions.use-case';

@Injectable()
export class SubscriptionRenewalScheduler {
  constructor(
    private readonly renewSubscriptionsUseCase: RenewSubscriptionsUseCase,
    private readonly expireSubscriptionsUseCase: ExpireSubscriptionsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSubscriptionLifecycle(): Promise<void> {
    const now = new Date();

    await this.renewSubscriptionsUseCase.execute(now);
    await this.expireSubscriptionsUseCase.execute(now);
  }
}