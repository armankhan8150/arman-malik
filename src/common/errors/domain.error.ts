export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InactiveSubscriptionError extends DomainError {
  readonly code = 'INACTIVE_SUBSCRIPTION';

  constructor(message = 'Subscription is not active') {
    super(message);
  }
}

export class SubscriptionNotRenewableError extends DomainError {
  readonly code = 'SUBSCRIPTION_NOT_RENEWABLE';

  constructor() {
    super('Subscription is not eligible for renewal');
  }
}

export class QuotaExceededError extends DomainError {
  readonly code = 'QUOTA_EXCEEDED';

  constructor() {
    super('Message quota has been exceeded');
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';

  constructor(
    message = 'You are not authorized to access this resource',
  ) {
    super(message);
  }
}

export class ResourceNotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(message = 'Requested resource was not found') {
    super(message);
  }
}