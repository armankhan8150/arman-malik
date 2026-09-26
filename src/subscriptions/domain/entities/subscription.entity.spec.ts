import { InactiveSubscriptionError } from '../../../common/errors/domain.error';
import {
  Subscription,
  SubscriptionStatus,
} from './subscription.entity';
import { BillingCycle } from '../value-objects/billing-cycle';
import { SubscriptionTier } from '../value-objects/subscription-tier';

describe('Subscription', () => {
  const createSubscription = (): Subscription =>
    new Subscription({
      id: 'subscription-1',
      userId: 'user-1',
      tier: SubscriptionTier.BASIC,
      billingCycle: BillingCycle.MONTHLY,
      maxMessages: 10,
      price: 10,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-10-01T00:00:00.000Z'),
      renewalDate: new Date('2026-10-01T00:00:00.000Z'),
      autoRenew: true,
      status: SubscriptionStatus.ACTIVE,
      cancellationDate: null,
    });

  describe('isActive', () => {
    it('is active during its billing period', () => {
      const subscription = createSubscription();

      expect(
        subscription.isActive(
          new Date('2026-09-15T00:00:00.000Z'),
        ),
      ).toBe(true);
    });

    it('is not active after the billing period ends', () => {
      const subscription = createSubscription();

      expect(
        subscription.isActive(
          new Date('2026-10-01T00:00:00.000Z'),
        ),
      ).toBe(false);
    });
  });

  describe('cancel', () => {
    it('preserves the active subscription until the current billing period ends', () => {
      const subscription = createSubscription();

      const cancelledAt = new Date(
        '2026-09-15T12:00:00.000Z',
      );

      subscription.cancel(cancelledAt);

      expect(subscription.autoRenew).toBe(false);
      expect(subscription.cancellationDate).toEqual(
        cancelledAt,
      );

      expect(subscription.status).toBe(
        SubscriptionStatus.ACTIVE,
      );

      expect(
        subscription.isActive(
          new Date('2026-09-20T00:00:00.000Z'),
        ),
      ).toBe(true);

      expect(subscription.endDate.toISOString()).toBe(
        '2026-10-01T00:00:00.000Z',
      );
    });

    it('cannot cancel an already inactive subscription', () => {
      const subscription = createSubscription();

      subscription.markInactive();

      expect(() =>
        subscription.cancel(
          new Date('2026-09-15T00:00:00.000Z'),
        ),
      ).toThrow(InactiveSubscriptionError);
    });
  });

  describe('markInactive', () => {
    it('marks the subscription inactive and disables auto-renewal', () => {
      const subscription = createSubscription();

      subscription.markInactive();

      expect(subscription.status).toBe(
        SubscriptionStatus.INACTIVE,
      );
      expect(subscription.autoRenew).toBe(false);
    });
  });
});