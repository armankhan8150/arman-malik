import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { QuotaExceededError } from '../../common/errors/domain.error';
import {
  ChatQuotaRepository,
  ConsumeQuotaAndSaveChatInput,
  ConsumeQuotaAndSaveChatResult,
  ConsumedQuota,
} from './chat-quota.repository';

@Injectable()
export class PrismaChatQuotaRepository implements ChatQuotaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consumeQuotaAndSaveChat(
    input: ConsumeQuotaAndSaveChatInput,
  ): Promise<ConsumeQuotaAndSaveChatResult> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.consumeQuotaAndSaveChatTransaction(input);
      } catch (error: unknown) {
        const isRetryableConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!isRetryableConflict || attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('Chat transaction retry loop exited unexpectedly');
  }

  private async consumeQuotaAndSaveChatTransaction(
    input: ConsumeQuotaAndSaveChatInput,
  ): Promise<ConsumeQuotaAndSaveChatResult> {
    return this.prisma.$transaction(
      async (tx) => {
        const { userId, createdAt } = input;

        const year = createdAt.getUTCFullYear();
        const month = createdAt.getUTCMonth() + 1;

        const freeUsage = await tx.monthlyUsage.upsert({
          where: {
            userId_year_month: {
              userId,
              year,
              month,
            },
          },
          create: {
            userId,
            year,
            month,
            messagesUsed: 0,
          },
          update: {},
        });

        let consumedQuota: ConsumedQuota | null = null;

        /*
         * Try the user's 3 monthly free messages first.
         */
        if (freeUsage.messagesUsed < 3) {
          const consumed = await tx.monthlyUsage.updateMany({
            where: {
              id: freeUsage.id,
              messagesUsed: {
                lt: 3,
              },
            },
            data: {
              messagesUsed: {
                increment: 1,
              },
            },
          });

          if (consumed.count === 1) {
            consumedQuota = {
              source: 'FREE',
              subscriptionId: null,
            };
          }
        }

        /*
         * Free quota exhausted:
         * look through currently active subscription bundles.
         */
        if (!consumedQuota) {
          const subscriptions = await tx.subscription.findMany({
            where: {
              userId,
              status: 'ACTIVE',
              startDate: {
                lte: createdAt,
              },
              endDate: {
                gt: createdAt,
              },
            },
            orderBy: {
              startDate: 'desc',
            },
            include: {
              usages: {
                where: {
                  periodStart: {
                    lte: createdAt,
                  },
                  periodEnd: {
                    gt: createdAt,
                  },
                },
              },
            },
          });

          for (const subscription of subscriptions) {
            let usage = subscription.usages[0];

            if (!usage) {
              usage = await tx.subscriptionUsage.upsert({
                where: {
                  subscriptionId_periodStart: {
                    subscriptionId: subscription.id,
                    periodStart: subscription.startDate,
                  },
                },
                create: {
                  subscriptionId: subscription.id,
                  messagesUsed: 0,
                  periodStart: subscription.startDate,
                  periodEnd: subscription.endDate,
                },
                update: {},
              });
            }

            /*
             * Enterprise is unlimited, but usage is still recorded.
             */
            if (subscription.tier === 'ENTERPRISE') {
              await tx.subscriptionUsage.update({
                where: {
                  id: usage.id,
                },
                data: {
                  messagesUsed: {
                    increment: 1,
                  },
                },
              });

              consumedQuota = {
                source: 'SUBSCRIPTION',
                subscriptionId: subscription.id,
              };

              break;
            }

            if (subscription.maxMessages === null) {
              continue;
            }

            /*
             * Basic/Pro quota check and increment happen in the
             * same database statement.
             */
            const consumed = await tx.subscriptionUsage.updateMany({
              where: {
                id: usage.id,
                messagesUsed: {
                  lt: subscription.maxMessages,
                },
              },
              data: {
                messagesUsed: {
                  increment: 1,
                },
              },
            });

            if (consumed.count === 1) {
              consumedQuota = {
                source: 'SUBSCRIPTION',
                subscriptionId: subscription.id,
              };

              break;
            }
          }
        }

        if (!consumedQuota) {
          throw new QuotaExceededError();
        }

        /*
         * Persist the Chat inside this SAME transaction.
         *
         * If this INSERT fails, the quota mutation above is rolled
         * back automatically.
         */
        const chat = await tx.chat.create({
          data: {
            userId: input.userId,
            question: input.question,
            aiAnswer: input.aiAnswer,
            tokenUsage: input.tokenUsage,
            usageSource: consumedQuota.source,
            subscriptionId: consumedQuota.subscriptionId,
            createdAt: input.createdAt,
          },
        });

        return {
          quota: consumedQuota,
          chat: {
            id: chat.id,
            userId: chat.userId,
            question: chat.question,
            aiAnswer: chat.aiAnswer,
            tokenUsage: chat.tokenUsage,
            usageSource: chat.usageSource,
            subscriptionId: chat.subscriptionId,
            createdAt: chat.createdAt,
          },
        };
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }
}