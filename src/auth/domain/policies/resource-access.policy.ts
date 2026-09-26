import { ForbiddenError } from '../../../common/errors/domain.error';
import { UserRole } from '../../repositories/user.repository';

export interface ResourceAccessContext {
  requesterId: string;
  requesterRole: UserRole;
  resourceOwnerId: string;
}

export class ResourceAccessPolicy {
  static assertCanAccessOwnResourceOrAdmin(
    context: ResourceAccessContext,
  ): void {
    if (context.requesterRole === 'ADMIN') {
      return;
    }

    if (context.requesterId === context.resourceOwnerId) {
      return;
    }

    throw new ForbiddenError();
  }

  static assertAdmin(role: UserRole): void {
    if (role !== 'ADMIN') {
      throw new ForbiddenError(
        'Administrator privileges are required',
      );
    }
  }
}