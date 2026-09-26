import { Injectable } from '@nestjs/common';
import { ResourceAccessPolicy } from '../../auth/domain/policies/resource-access.policy';
import type { UserRole } from '../../auth/repositories/user.repository';
import { ResourceNotFoundError } from '../../common/errors/domain.error';
import { SubscriptionRepository } from '../repositories/subscription.repository';

export interface CancelSubscriptionInput {
  subscriptionId: string;
  requesterId: string;
  requesterRole: UserRole;
}

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: CancelSubscriptionInput): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findById(
        input.subscriptionId,
      );

    if (!subscription) {
      throw new ResourceNotFoundError(
        'Subscription was not found',
      );
    }

    ResourceAccessPolicy.assertCanAccessOwnResourceOrAdmin({
      requesterId: input.requesterId,
      requesterRole: input.requesterRole,
      resourceOwnerId: subscription.userId,
    });

    subscription.cancel();

    await this.subscriptionRepository.save(subscription);
  }
}