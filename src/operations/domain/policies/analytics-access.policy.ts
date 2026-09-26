import { ResourceAccessPolicy } from '../../../auth/domain/policies/resource-access.policy';
import type { UserRole } from '../../../auth/repositories/user.repository';

export class AnalyticsAccessPolicy {
  static assertCanViewAnalytics(
    role: UserRole,
  ): void {
    ResourceAccessPolicy.assertAdmin(role);
  }
}