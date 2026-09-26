import { Injectable } from '@nestjs/common';
import { PaymentSimulatorService } from '../domain/services/payment-simulator.service';
import { SubscriptionLifecycleService } from '../domain/services/subscription-lifecycle.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class RenewSubscriptionsUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentSimulator: PaymentSimulatorService,
  ) {}

  async execute(at: Date = new Date()): Promise<void> {
    const subscriptions =
      await this.subscriptionRepository.findDueForRenewal(at);

    for (const subscription of subscriptions) {
      const paymentSucceeded =
        this.paymentSimulator.processPayment();

      if (!paymentSucceeded) {
        subscription.markInactive();

        await this.subscriptionRepository.save(subscription);

        continue;
      }

      const renewedSubscription =
        SubscriptionLifecycleService.renew(
          subscription,
          subscription.renewalDate,
        );

      await this.subscriptionRepository.save(
        renewedSubscription,
      );
    }
  }
}