import { Injectable } from '@nestjs/common';
import { MockAiService } from '../domain/services/mock-ai.service';
import { ChatQuotaRepository } from '../repositories/chat-quota.repository';

export interface SendChatMessageInput {
  userId: string;
  question: string;
}

export interface SendChatMessageResult {
  id: string;
  question: string;
  answer: string;
  tokenUsage: number;
  createdAt: Date;
}

@Injectable()
export class SendChatMessageUseCase {
  constructor(
    private readonly chatQuotaRepository: ChatQuotaRepository,
    private readonly mockAiService: MockAiService,
  ) {}

  async execute(
    input: SendChatMessageInput,
  ): Promise<SendChatMessageResult> {
    const aiResponse = await this.mockAiService.generateResponse(
      input.question,
    );

    const result =
      await this.chatQuotaRepository.consumeQuotaAndSaveChat({
        userId: input.userId,
        question: input.question,
        aiAnswer: aiResponse.answer,
        tokenUsage: aiResponse.tokenUsage,
        createdAt: new Date(),
      });

    return {
      id: result.chat.id,
      question: result.chat.question,
      answer: result.chat.aiAnswer,
      tokenUsage: result.chat.tokenUsage,
      createdAt: result.chat.createdAt,
    };
  }
}