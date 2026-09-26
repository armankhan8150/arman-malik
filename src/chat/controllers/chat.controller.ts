import { RateLimitGuard } from '../../common/security/rate-limit/rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit/rate-limit.decorator';
import { RateLimitCategory } from '../../common/security/rate-limit/rate-limit-category';

import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request';
import { SendChatMessageUseCase } from '../application/send-chat-message.use-case';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@Controller('chat')
@UseGuards(
  AuthenticationGuard, 
  RateLimitGuard,
)
@RateLimit(RateLimitCategory.CHAT)
export class ChatController {
  constructor(
    private readonly sendChatMessageUseCase: SendChatMessageUseCase,
  ) {}

  @Post()
  async sendMessage(
    @Req() request: AuthenticatedRequest,
    @Body() body: SendChatMessageDto,
  ) {
    return this.sendChatMessageUseCase.execute({
      userId: request.user.id,
      question: body.question,
    });
  }
}