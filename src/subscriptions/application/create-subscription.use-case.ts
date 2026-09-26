import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  Subscription,
  SubscriptionStatus,
} from '../domain/entities/subscription.entity';
import { SubscriptionLifecycleService } from '../domain/services/subscription-lifecycle.service';
import { SubscriptionPlanService } from '../domain/services/subscription-plan.service';
import { SubscriptionPricingService } from '../domain/services/subscription-pricing.service';
import { BillingCycle } from '../domain/value-objects/billing-cycle';
import { SubscriptionTier } from '../domain/value-objects/subscription-tier';
import { SubscriptionRepository } from '../repositories/subscription.repository';

export interface CreateSubscriptionInput {
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  autoRenew: boolean;
}

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<Subscription> {
    const startDate = new Date();

    const endDate = SubscriptionLifecycleService.calculateEndDate(
      startDate,
      input.billingCycle,
    );

    const maxMessages = SubscriptionPlanService.getMaxMessages(
      input.tier,
    );

    const price = SubscriptionPricingService.getPrice(input.tier);

    const subscription = new Subscription({
      id: randomUUID(),
      userId: input.userId,
      tier: input.tier,
      billingCycle: input.billingCycle,
      maxMessages,
      price,
      startDate,
      endDate,
      renewalDate: endDate,
      autoRenew: input.autoRenew,
      status: SubscriptionStatus.ACTIVE,
      cancellationDate: null,
    });

    await this.subscriptionRepository.save(subscription);

    return subscription;
  }
}