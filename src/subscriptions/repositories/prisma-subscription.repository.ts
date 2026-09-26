import { Injectable } from '@nestjs/common';
import {
  BillingCycle as PrismaBillingCycle,
  SubscriptionStatus as PrismaSubscriptionStatus,
  SubscriptionTier as PrismaSubscriptionTier,
} from '../../generated/prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import {
  Subscription,
  SubscriptionStatus,
} from '../domain/entities/subscription.entity';
import { BillingCycle } from '../domain/value-objects/billing-cycle';
import { SubscriptionTier } from '../domain/value-objects/subscription-tier';
import { SubscriptionRepository } from './subscription.repository';

@Injectable()
export class PrismaSubscriptionRepository
  implements SubscriptionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Subscription | null> {
    const record = await this.prisma.subscription.findUnique({
      where: { id },
    });

    return record ? this.toDomain(record) : null;
  }

  async findActiveByUserId(userId: string): Promise<Subscription[]> {
    const records = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: PrismaSubscriptionStatus.ACTIVE,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return records.map((record) => this.toDomain(record));
  }



  async save(subscription: Subscription): Promise<void> {
    await this.prisma.subscription.upsert({
      where: {
        id: subscription.id,
      },
      create: {
        id: subscription.id,
        userId: subscription.userId,
        tier: this.toPrismaTier(subscription.tier),
        billingCycle: this.toPrismaBillingCycle(subscription.billingCycle),
        maxMessages: subscription.maxMessages,
        price: subscription.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        autoRenew: subscription.autoRenew,
        status: this.toPrismaStatus(subscription.status),
        cancellationDate: subscription.cancellationDate,
      },
      update: {
        tier: this.toPrismaTier(subscription.tier),
        billingCycle: this.toPrismaBillingCycle(subscription.billingCycle),
        maxMessages: subscription.maxMessages,
        price: subscription.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        autoRenew: subscription.autoRenew,
        status: this.toPrismaStatus(subscription.status),
        cancellationDate: subscription.cancellationDate,
      },
    });
  }

  async findExpiredActive(at: Date): Promise<Subscription[]> {
  const records = await this.prisma.subscription.findMany({
    where: {
      status: PrismaSubscriptionStatus.ACTIVE,
      endDate: {
        lte: at,
      },
      autoRenew: false,
    },
    orderBy: {
      endDate: 'asc',
    },
  });

    return records.map((record) => this.toDomain(record));
  }

  async findDueForRenewal(at: Date): Promise<Subscription[]> {
  const records = await this.prisma.subscription.findMany({
    where: {
      status: PrismaSubscriptionStatus.ACTIVE,
      autoRenew: true,
      renewalDate: {
        lte: at,
      },
    },
    orderBy: {
      renewalDate: 'asc',
    },
  });

  return records.map((record) => this.toDomain(record));
}

  private toDomain(record: {
    id: string;
    userId: string;
    tier: PrismaSubscriptionTier;
    billingCycle: PrismaBillingCycle;
    maxMessages: number | null;
    price: unknown;
    startDate: Date;
    endDate: Date;
    renewalDate: Date;
    autoRenew: boolean;
    status: PrismaSubscriptionStatus;
    cancellationDate: Date | null;
  }): Subscription {
    return new Subscription({
      id: record.id,
      userId: record.userId,
      tier: record.tier as SubscriptionTier,
      billingCycle: record.billingCycle as BillingCycle,
      maxMessages: record.maxMessages,
      price: Number(record.price),
      startDate: record.startDate,
      endDate: record.endDate,
      renewalDate: record.renewalDate,
      autoRenew: record.autoRenew,
      status: record.status as SubscriptionStatus,
      cancellationDate: record.cancellationDate,
    });
  }

  private toPrismaTier(tier: SubscriptionTier): PrismaSubscriptionTier {
    return tier as PrismaSubscriptionTier;
  }

  private toPrismaBillingCycle(
    billingCycle: BillingCycle,
  ): PrismaBillingCycle {
    return billingCycle as PrismaBillingCycle;
  }

  private toPrismaStatus(
    status: SubscriptionStatus,
  ): PrismaSubscriptionStatus {
    return status as PrismaSubscriptionStatus;
  }
}