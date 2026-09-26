import { SubscriptionTier } from '../../../subscriptions/domain/value-objects/subscription-tier';
import {
  ChatQuotaPolicy,
  FREE_MONTHLY_MESSAGE_LIMIT,
} from './chat-quota.policy';

describe('ChatQuotaPolicy', () => {
  it('defines the monthly free allowance as 3 messages', () => {
    expect(FREE_MONTHLY_MESSAGE_LIMIT).toBe(3);
  });

  it('uses free quota when fewer than 3 free messages were used', () => {
    expect(ChatQuotaPolicy.decide(0, [])).toEqual({
      source: 'FREE',
      subscriptionId: null,
    });

    expect(ChatQuotaPolicy.decide(2, [])).toEqual({
      source: 'FREE',
      subscriptionId: null,
    });
  });

  it('uses an available subscription after free quota is exhausted', () => {
    const result = ChatQuotaPolicy.decide(3, [
      {
        id: 'basic-1',
        tier: SubscriptionTier.BASIC,
        remainingMessages: 5,
      },
    ]);

    expect(result).toEqual({
      source: 'SUBSCRIPTION',
      subscriptionId: 'basic-1',
    });
  });

  it('skips an exhausted bundle and uses the next available bundle', () => {
    const result = ChatQuotaPolicy.decide(3, [
      {
        id: 'newest-exhausted',
        tier: SubscriptionTier.BASIC,
        remainingMessages: 0,
      },
      {
        id: 'older-available',
        tier: SubscriptionTier.PRO,
        remainingMessages: 25,
      },
    ]);

    expect(result).toEqual({
      source: 'SUBSCRIPTION',
      subscriptionId: 'older-available',
    });
  });

  it('uses the first available bundle from the supplied ordering', () => {
    const result = ChatQuotaPolicy.decide(3, [
      {
        id: 'newest',
        tier: SubscriptionTier.PRO,
        remainingMessages: 100,
      },
      {
        id: 'older',
        tier: SubscriptionTier.BASIC,
        remainingMessages: 10,
      },
    ]);

    expect(result).toEqual({
      source: 'SUBSCRIPTION',
      subscriptionId: 'newest',
    });
  });

  it('allows Enterprise when free quota is exhausted', () => {
    const result = ChatQuotaPolicy.decide(3, [
      {
        id: 'enterprise-1',
        tier: SubscriptionTier.ENTERPRISE,
        remainingMessages: null,
      },
    ]);

    expect(result).toEqual({
      source: 'SUBSCRIPTION',
      subscriptionId: 'enterprise-1',
    });
  });

  it('returns null when no quota is available', () => {
    const result = ChatQuotaPolicy.decide(3, [
      {
        id: 'basic-exhausted',
        tier: SubscriptionTier.BASIC,
        remainingMessages: 0,
      },
      {
        id: 'pro-exhausted',
        tier: SubscriptionTier.PRO,
        remainingMessages: 0,
      },
    ]);

    expect(result).toBeNull();
  });
});