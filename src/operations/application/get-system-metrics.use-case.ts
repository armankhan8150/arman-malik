import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../auth/repositories/user.repository';
import { PrismaService } from '../../common/database/prisma.service';
import { AnalyticsAccessPolicy } from '../domain/policies/analytics-access.policy';

export interface GetSystemMetricsInput {
  requesterRole: UserRole;
}

@Injectable()
export class GetSystemMetricsUseCase {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    input: GetSystemMetricsInput,
  ) {
    AnalyticsAccessPolicy.assertCanViewAnalytics(
      input.requesterRole,
    );

    const now = new Date();

    const [
      totalChats,
      monthlyUsage,
      totalSubscriptions,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.chat.count(),

      this.prisma.monthlyUsage.aggregate({
        where: {
          year: now.getUTCFullYear(),
          month: now.getUTCMonth() + 1,
        },
        _sum: {
          messagesUsed: true,
        },
      }),

      this.prisma.subscription.count(),

      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      usage: {
        totalChats,
        currentMonthMessages:
          monthlyUsage._sum.messagesUsed ?? 0,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        inactive:
          totalSubscriptions -
          activeSubscriptions,
      },
      generatedAt: now.toISOString(),
    };
  }
}