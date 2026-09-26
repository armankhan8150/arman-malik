import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { SecurityModule } from '../common/security/security.module';
import { CancelSubscriptionUseCase } from './application/cancel-subscription.use-case';
import { CreateSubscriptionUseCase } from './application/create-subscription.use-case';
import { ExpireSubscriptionsUseCase } from './application/expire-subscriptions.use-case';
import { RenewSubscriptionsUseCase } from './application/renew-subscriptions.use-case';
import { SubscriptionRenewalScheduler } from './application/subscription-renewal.scheduler';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { PaymentSimulatorService } from './domain/services/payment-simulator.service';
import { PrismaSubscriptionRepository } from './repositories/prisma-subscription.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    SecurityModule,
  ],
  controllers: [SubscriptionsController],
  providers: [
    {
      provide: SubscriptionRepository,
      useClass: PrismaSubscriptionRepository,
    },
    PaymentSimulatorService,
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
    RenewSubscriptionsUseCase,
    ExpireSubscriptionsUseCase,
    SubscriptionRenewalScheduler,
  ],
  exports: [
    SubscriptionRepository,
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
  ],
})
export class SubscriptionsModule {}