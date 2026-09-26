import { SubscriptionTier } from '../value-objects/subscription-tier';

export class SubscriptionPlanService {
  static getMaxMessages(tier: SubscriptionTier): number | null {
    switch (tier) {
      case SubscriptionTier.BASIC:
        return 10;

      case SubscriptionTier.PRO:
        return 100;

      case SubscriptionTier.ENTERPRISE:
        return null;
    }
  }

  static isUnlimited(tier: SubscriptionTier): boolean {
    return tier === SubscriptionTier.ENTERPRISE;
  }
}