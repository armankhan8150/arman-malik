import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class ExpireSubscriptionsUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(at: Date = new Date()): Promise<void> {
    const subscriptions =
      await this.subscriptionRepository.findExpiredActive(at);

    for (const subscription of subscriptions) {
      subscription.markInactive();

      await this.subscriptionRepository.save(subscription);
    }
  }
}