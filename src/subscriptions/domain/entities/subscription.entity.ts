import { InactiveSubscriptionError } from '../../../common/errors/domain.error';
import { BillingCycle } from '../value-objects/billing-cycle';
import { SubscriptionTier } from '../value-objects/subscription-tier';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface SubscriptionProps {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  maxMessages: number | null;
  price: number;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
  status: SubscriptionStatus;
  cancellationDate: Date | null;
}

export class Subscription {
  constructor(private readonly props: SubscriptionProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get tier(): SubscriptionTier {
    return this.props.tier;
  }

  get billingCycle(): BillingCycle {
    return this.props.billingCycle;
  }

  get maxMessages(): number | null {
    return this.props.maxMessages;
  }

  get price(): number {
    return this.props.price;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get renewalDate(): Date {
    return this.props.renewalDate;
  }

  get autoRenew(): boolean {
    return this.props.autoRenew;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get cancellationDate(): Date | null {
    return this.props.cancellationDate;
  }

  isActive(at: Date = new Date()): boolean {
    return (
      this.props.status === SubscriptionStatus.ACTIVE &&
      at >= this.props.startDate &&
      at < this.props.endDate
    );
  }

  cancel(at: Date = new Date()): void {
    if (!this.isActive(at)) {
      throw new InactiveSubscriptionError('Only an active subscription can be cancelled',
        
      );
    }

    this.props.autoRenew = false;
    this.props.cancellationDate = at;
  }

  markInactive(): void {
    this.props.status = SubscriptionStatus.INACTIVE;
    this.props.autoRenew = false;
  }
}