import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  AuthenticatedUser,
  CreateAuthenticatedUserInput,
  UserRepository,
} from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAuthenticatedUser(
    input: CreateAuthenticatedUserInput,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.create({
      data: {
        authProviderId: input.authProviderId,
        email: input.email ?? null,
        role: 'USER',
      },
    });

    return this.toAuthenticatedUser(user);
  }

  async findByAuthProviderId(
    authProviderId: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        authProviderId,
      },
    });

    return user ? this.toAuthenticatedUser(user) : null;
  }

  async findById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user ? this.toAuthenticatedUser(user) : null;
  }

  private toAuthenticatedUser(user: {
    id: string;
    authProviderId: string;
    email: string | null;
    role: 'USER' | 'ADMIN';
  }): AuthenticatedUser {
    return {
      id: user.id,
      authProviderId: user.authProviderId,
      email: user.email,
      role: user.role,
    };
  }
}