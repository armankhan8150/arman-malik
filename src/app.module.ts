import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from './common/database/database.module';
import { RequestLoggingMiddleware } from './common/observability/request-logging.middleware';
import { JsonContentTypeMiddleware } from './common/security/json-content-type.middleware';
import { RequestTimeoutMiddleware } from './common/security/request-timeout.middleware';
import { OperationsModule } from './operations/operations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    SubscriptionsModule,
    ChatModule,
    OperationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule
  implements NestModule
{
  configure(
    consumer: MiddlewareConsumer,
  ): void {
    consumer
      .apply(
        RequestLoggingMiddleware,
        JsonContentTypeMiddleware,
        RequestTimeoutMiddleware,
      )
      .forRoutes('*');
  }
}