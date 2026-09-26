import { Subscription } from '../domain/entities/subscription.entity';

export abstract class SubscriptionRepository {
  abstract findById(id: string): Promise<Subscription | null>;

  abstract findActiveByUserId(userId: string): Promise<Subscription[]>;

  abstract findDueForRenewal(at: Date): Promise<Subscription[]>;

  abstract findExpiredActive(at: Date): Promise<Subscription[]>;

  abstract save(subscription: Subscription): Promise<void>;
}