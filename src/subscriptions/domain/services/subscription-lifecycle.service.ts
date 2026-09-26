import { SubscriptionNotRenewableError } from '../../../common/errors/domain.error';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { BillingCycle } from '../value-objects/billing-cycle';

export class SubscriptionLifecycleService {
  static calculateEndDate(
    startDate: Date,
    billingCycle: BillingCycle,
  ): Date {
    const year = startDate.getUTCFullYear();
    const month = startDate.getUTCMonth();
    const day = startDate.getUTCDate();

    let targetYear: number;
    let targetMonth: number;

    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        targetYear = year;
        targetMonth = month + 1;
        break;

      case BillingCycle.YEARLY:
        targetYear = year + 1;
        targetMonth = month;
        break;
    }

    const normalizedTarget = new Date(
      Date.UTC(
        targetYear,
        targetMonth,
        1,
        startDate.getUTCHours(),
        startDate.getUTCMinutes(),
        startDate.getUTCSeconds(),
        startDate.getUTCMilliseconds(),
      ),
    );

    const lastDayOfTargetMonth = new Date(
      Date.UTC(
        normalizedTarget.getUTCFullYear(),
        normalizedTarget.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();

    normalizedTarget.setUTCDate(
      Math.min(day, lastDayOfTargetMonth),
    );

    return normalizedTarget;
  }

  static canRenew(
    subscription: Subscription,
    at: Date = new Date(),
  ): boolean {
    return (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.autoRenew &&
      at >= subscription.renewalDate
    );
  }

  static renew(
    subscription: Subscription,
    renewedAt: Date,
  ): Subscription {
    if (!this.canRenew(subscription, renewedAt)) {
      throw new SubscriptionNotRenewableError();
    }

    const newEndDate = this.calculateEndDate(
      renewedAt,
      subscription.billingCycle,
    );

    return new Subscription({
      id: subscription.id,
      userId: subscription.userId,
      tier: subscription.tier,
      billingCycle: subscription.billingCycle,
      maxMessages: subscription.maxMessages,
      price: subscription.price,
      startDate: renewedAt,
      endDate: newEndDate,
      renewalDate: newEndDate,
      autoRenew: true,
      status: SubscriptionStatus.ACTIVE,
      cancellationDate: null,
    });
  }
}