import { SubscriptionTier } from '../value-objects/subscription-tier';

export class SubscriptionPricingService {
  static getPrice(tier: SubscriptionTier): number {
    const environmentVariable =
      SubscriptionPricingService.getEnvironmentVariable(tier);

    const rawPrice = process.env[environmentVariable];

    if (!rawPrice) {
      throw new Error(
        `Subscription price is not configured for ${tier}`,
      );
    }

    const price = Number(rawPrice);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(
        `Invalid subscription price configured for ${tier}`,
      );
    }

    return price;
  }

  private static getEnvironmentVariable(
    tier: SubscriptionTier,
  ): string {
    switch (tier) {
      case SubscriptionTier.BASIC:
        return 'SUBSCRIPTION_PRICE_BASIC';

      case SubscriptionTier.PRO:
        return 'SUBSCRIPTION_PRICE_PRO';

      case SubscriptionTier.ENTERPRISE:
        return 'SUBSCRIPTION_PRICE_ENTERPRISE';
    }
  }
}