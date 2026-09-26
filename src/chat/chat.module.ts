import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SecurityModule } from '../common/security/security.module';
import { SendChatMessageUseCase } from './application/send-chat-message.use-case';
import { ChatController } from './controllers/chat.controller';
import { MockAiService } from './domain/services/mock-ai.service';
import { ChatQuotaRepository } from './repositories/chat-quota.repository';
import { PrismaChatQuotaRepository } from './repositories/prisma-chat-quota.repository';

@Module({
  imports: [
    AuthModule,
    SecurityModule,
  ],
  controllers: [ChatController],
  providers: [
    {
      provide: ChatQuotaRepository,
      useClass: PrismaChatQuotaRepository,
    },
    MockAiService,
    SendChatMessageUseCase,
  ],
  exports: [SendChatMessageUseCase],
})
export class ChatModule {}