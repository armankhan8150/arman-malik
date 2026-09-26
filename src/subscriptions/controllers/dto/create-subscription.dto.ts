import { IsBoolean, IsEnum } from 'class-validator';
import { BillingCycle } from '../../domain/value-objects/billing-cycle';
import { SubscriptionTier } from '../../domain/value-objects/subscription-tier';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier!: SubscriptionTier;

  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @IsBoolean()
  autoRenew!: boolean;
}