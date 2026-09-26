import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { BillingCycle } from '../value-objects/billing-cycle';
import { SubscriptionTier } from '../value-objects/subscription-tier';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { SubscriptionNotRenewableError } from '../../../common/errors/domain.error';

describe('SubscriptionLifecycleService', () => {
  const createSubscription = (
    overrides: Partial<{
      autoRenew: boolean;
      status: SubscriptionStatus;
      startDate: Date;
      endDate: Date;
      renewalDate: Date;
    }> = {},
  ): Subscription => {
    const startDate =
      overrides.startDate ??
      new Date('2026-09-01T00:00:00.000Z');

    const endDate =
      overrides.endDate ??
      new Date('2026-10-01T00:00:00.000Z');

    return new Subscription({
      id: 'subscription-1',
      userId: 'user-1',
      tier: SubscriptionTier.BASIC,
      billingCycle: BillingCycle.MONTHLY,
      maxMessages: 10,
      price: 10,
      startDate,
      endDate,
      renewalDate: overrides.renewalDate ?? endDate,
      autoRenew: overrides.autoRenew ?? true,
      status: overrides.status ?? SubscriptionStatus.ACTIVE,
      cancellationDate: null,
    });
  };

  describe('calculateEndDate', () => {
    it('calculates a normal monthly billing period', () => {
      const start = new Date('2026-09-26T12:30:00.000Z');

      const result =
        SubscriptionLifecycleService.calculateEndDate(
          start,
          BillingCycle.MONTHLY,
        );

      expect(result.toISOString()).toBe(
        '2026-10-26T12:30:00.000Z',
      );
    });

    it('calculates a yearly billing period', () => {
      const start = new Date('2026-09-26T12:30:00.000Z');

      const result =
        SubscriptionLifecycleService.calculateEndDate(
          start,
          BillingCycle.YEARLY,
        );

      expect(result.toISOString()).toBe(
        '2027-09-26T12:30:00.000Z',
      );
    });

    it('clamps a monthly period to the last valid day of the target month', () => {
      const start = new Date('2026-01-31T12:30:00.000Z');

      const result =
        SubscriptionLifecycleService.calculateEndDate(
          start,
          BillingCycle.MONTHLY,
        );

      expect(result.toISOString()).toBe(
        '2026-02-28T12:30:00.000Z',
      );
    });

    it('handles leap years for monthly billing', () => {
      const start = new Date('2028-01-31T12:30:00.000Z');

      const result =
        SubscriptionLifecycleService.calculateEndDate(
          start,
          BillingCycle.MONTHLY,
        );

      expect(result.toISOString()).toBe(
        '2028-02-29T12:30:00.000Z',
      );
    });

    it('clamps leap day for yearly billing', () => {
      const start = new Date('2028-02-29T12:30:00.000Z');

      const result =
        SubscriptionLifecycleService.calculateEndDate(
          start,
          BillingCycle.YEARLY,
        );

      expect(result.toISOString()).toBe(
        '2029-02-28T12:30:00.000Z',
      );
    });
  });

  describe('canRenew', () => {
    it('allows an active auto-renewing subscription at its renewal date', () => {
      const subscription = createSubscription();

      const result = SubscriptionLifecycleService.canRenew(
        subscription,
        new Date('2026-10-01T00:00:00.000Z'),
      );

      expect(result).toBe(true);
    });

    it('does not allow renewal before the renewal date', () => {
      const subscription = createSubscription();

      const result = SubscriptionLifecycleService.canRenew(
        subscription,
        new Date('2026-09-30T23:59:59.000Z'),
      );

      expect(result).toBe(false);
    });

    it('does not allow renewal when auto-renew is disabled', () => {
      const subscription = createSubscription({
        autoRenew: false,
      });

      const result = SubscriptionLifecycleService.canRenew(
        subscription,
        new Date('2026-10-01T00:00:00.000Z'),
      );

      expect(result).toBe(false);
    });

    it('does not allow an inactive subscription to renew', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.INACTIVE,
      });

      const result = SubscriptionLifecycleService.canRenew(
        subscription,
        new Date('2026-10-01T00:00:00.000Z'),
      );

      expect(result).toBe(false);
    });
  });

  describe('renew', () => {
    it('creates the next active billing period', () => {
      const subscription = createSubscription();

      const renewedAt = new Date(
        '2026-10-01T00:00:00.000Z',
      );

      const renewed = SubscriptionLifecycleService.renew(
        subscription,
        renewedAt,
      );

      expect(renewed.id).toBe(subscription.id);
      expect(renewed.userId).toBe(subscription.userId);
      expect(renewed.tier).toBe(SubscriptionTier.BASIC);
      expect(renewed.billingCycle).toBe(
        BillingCycle.MONTHLY,
      );
      expect(renewed.maxMessages).toBe(10);
      expect(renewed.price).toBe(10);

      expect(renewed.startDate.toISOString()).toBe(
        '2026-10-01T00:00:00.000Z',
      );

      expect(renewed.endDate.toISOString()).toBe(
        '2026-11-01T00:00:00.000Z',
      );

      expect(renewed.renewalDate.toISOString()).toBe(
        '2026-11-01T00:00:00.000Z',
      );

      expect(renewed.autoRenew).toBe(true);
      expect(renewed.status).toBe(
        SubscriptionStatus.ACTIVE,
      );
      expect(renewed.cancellationDate).toBeNull();
    });

    it('throws when the subscription is not eligible for renewal', () => {
      const subscription = createSubscription({
        autoRenew: false,
      });

      expect(() =>
        SubscriptionLifecycleService.renew(
          subscription,
          new Date('2026-10-01T00:00:00.000Z'),
        ),
      ).toThrow(SubscriptionNotRenewableError);
    });
  });
});