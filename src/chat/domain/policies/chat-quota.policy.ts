import { SubscriptionTier } from '../../../subscriptions/domain/value-objects/subscription-tier';

export const FREE_MONTHLY_MESSAGE_LIMIT = 3;

export interface SubscriptionQuota {
  id: string;
  tier: SubscriptionTier;
  remainingMessages: number | null;
}

export type QuotaDecision =
  | {
      source: 'FREE';
      subscriptionId: null;
    }
  | {
      source: 'SUBSCRIPTION';
      subscriptionId: string;
    };

export class ChatQuotaPolicy {
  static decide(
    freeMessagesUsed: number,
    subscriptions: SubscriptionQuota[],
  ): QuotaDecision | null {
    if (freeMessagesUsed < FREE_MONTHLY_MESSAGE_LIMIT) {
      return {
        source: 'FREE',
        subscriptionId: null,
      };
    }

    const availableSubscription = subscriptions.find(
      (subscription) =>
        subscription.tier === SubscriptionTier.ENTERPRISE ||
        (subscription.remainingMessages !== null &&
          subscription.remainingMessages > 0),
    );

    if (!availableSubscription) {
      return null;
    }

    return {
      source: 'SUBSCRIPTION',
      subscriptionId: availableSubscription.id,
    };
  }
}