import {
  Subscription,
  SubscriptionStatus,
} from '../domain/entities/subscription.entity';
import { PaymentSimulatorService } from '../domain/services/payment-simulator.service';
import { BillingCycle } from '../domain/value-objects/billing-cycle';
import { SubscriptionTier } from '../domain/value-objects/subscription-tier';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { RenewSubscriptionsUseCase } from './renew-subscriptions.use-case';

describe('RenewSubscriptionsUseCase', () => {
  let subscriptionRepository: jest.Mocked<SubscriptionRepository>;
  let paymentSimulator: jest.Mocked<PaymentSimulatorService>;
  let useCase: RenewSubscriptionsUseCase;

  const createDueSubscription = (): Subscription =>
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

  beforeEach(() => {
    subscriptionRepository = {
      findById: jest.fn(),
      findActiveByUserId: jest.fn(),
      findDueForRenewal: jest.fn(),
      findExpiredActive: jest.fn(),
      save: jest.fn(),
    };

    paymentSimulator = {
      processPayment: jest.fn(),
    };

    useCase = new RenewSubscriptionsUseCase(
      subscriptionRepository,
      paymentSimulator,
    );
  });

  it('renews a due subscription when payment succeeds', async () => {
    const subscription = createDueSubscription();

    subscriptionRepository.findDueForRenewal.mockResolvedValue([
      subscription,
    ]);

    paymentSimulator.processPayment.mockReturnValue(true);

    const schedulerTime = new Date(
      '2026-10-01T00:15:00.000Z',
    );

    await useCase.execute(schedulerTime);

    expect(
      subscriptionRepository.findDueForRenewal,
    ).toHaveBeenCalledWith(schedulerTime);

    expect(
      paymentSimulator.processPayment,
    ).toHaveBeenCalledTimes(1);

    expect(subscriptionRepository.save).toHaveBeenCalledTimes(1);

    const savedSubscription =
      subscriptionRepository.save.mock.calls[0][0];

    expect(savedSubscription.status).toBe(
      SubscriptionStatus.ACTIVE,
    );

    expect(savedSubscription.autoRenew).toBe(true);

    expect(savedSubscription.startDate.toISOString()).toBe(
      '2026-10-01T00:00:00.000Z',
    );

    expect(savedSubscription.endDate.toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );

    expect(savedSubscription.renewalDate.toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );
  });

  it('marks the subscription inactive when payment fails', async () => {
    const subscription = createDueSubscription();

    subscriptionRepository.findDueForRenewal.mockResolvedValue([
      subscription,
    ]);

    paymentSimulator.processPayment.mockReturnValue(false);

    await useCase.execute(
      new Date('2026-10-01T00:15:00.000Z'),
    );

    expect(subscription.status).toBe(
      SubscriptionStatus.INACTIVE,
    );

    expect(subscription.autoRenew).toBe(false);

    expect(subscriptionRepository.save).toHaveBeenCalledWith(
      subscription,
    );

    expect(subscriptionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there are no subscriptions due for renewal', async () => {
    subscriptionRepository.findDueForRenewal.mockResolvedValue([]);

    const at = new Date('2026-10-01T00:15:00.000Z');

    await useCase.execute(at);

    expect(
      subscriptionRepository.findDueForRenewal,
    ).toHaveBeenCalledWith(at);

    expect(
      paymentSimulator.processPayment,
    ).not.toHaveBeenCalled();

    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('processes each due subscription independently', async () => {
    const firstSubscription = createDueSubscription();

    const secondSubscription = new Subscription({
      id: 'subscription-2',
      userId: 'user-1',
      tier: SubscriptionTier.PRO,
      billingCycle: BillingCycle.MONTHLY,
      maxMessages: 100,
      price: 25,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-10-01T00:00:00.000Z'),
      renewalDate: new Date('2026-10-01T00:00:00.000Z'),
      autoRenew: true,
      status: SubscriptionStatus.ACTIVE,
      cancellationDate: null,
    });

    subscriptionRepository.findDueForRenewal.mockResolvedValue([
      firstSubscription,
      secondSubscription,
    ]);

    paymentSimulator.processPayment
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    await useCase.execute(
      new Date('2026-10-01T00:15:00.000Z'),
    );

    expect(
      paymentSimulator.processPayment,
    ).toHaveBeenCalledTimes(2);

    expect(subscriptionRepository.save).toHaveBeenCalledTimes(2);

    const firstSaved =
      subscriptionRepository.save.mock.calls[0][0];

    const secondSaved =
      subscriptionRepository.save.mock.calls[1][0];

    expect(firstSaved.status).toBe(
      SubscriptionStatus.ACTIVE,
    );

    expect(firstSaved.startDate.toISOString()).toBe(
      '2026-10-01T00:00:00.000Z',
    );

    expect(secondSaved.status).toBe(
      SubscriptionStatus.INACTIVE,
    );

    expect(secondSaved.autoRenew).toBe(false);
  });
});