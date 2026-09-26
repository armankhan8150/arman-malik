export type UserRole = 'USER' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;
  authProviderId: string;
  email: string | null;
  role: UserRole;
}

export interface CreateAuthenticatedUserInput {
  authProviderId: string;
  email?: string | null;
}

export abstract class UserRepository {
  abstract createAuthenticatedUser(
    input: CreateAuthenticatedUserInput,
  ): Promise<AuthenticatedUser>;

  abstract findByAuthProviderId(
    authProviderId: string,
  ): Promise<AuthenticatedUser | null>;

  abstract findById(id: string): Promise<AuthenticatedUser | null>;
}