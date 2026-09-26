import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionTier } from '../value-objects/subscription-tier';

describe('SubscriptionPlanService', () => {
  describe('getMaxMessages', () => {
    it('returns 10 messages for Basic', () => {
      expect(
        SubscriptionPlanService.getMaxMessages(SubscriptionTier.BASIC),
      ).toBe(10);
    });

    it('returns 100 messages for Pro', () => {
      expect(
        SubscriptionPlanService.getMaxMessages(SubscriptionTier.PRO),
      ).toBe(100);
    });

    it('returns null for unlimited Enterprise quota', () => {
      expect(
        SubscriptionPlanService.getMaxMessages(
          SubscriptionTier.ENTERPRISE,
        ),
      ).toBeNull();
    });
  });

  describe('isUnlimited', () => {
    it('returns true only for Enterprise', () => {
      expect(
        SubscriptionPlanService.isUnlimited(
          SubscriptionTier.ENTERPRISE,
        ),
      ).toBe(true);

      expect(
        SubscriptionPlanService.isUnlimited(SubscriptionTier.BASIC),
      ).toBe(false);

      expect(
        SubscriptionPlanService.isUnlimited(SubscriptionTier.PRO),
      ).toBe(false);
    });
  });
});