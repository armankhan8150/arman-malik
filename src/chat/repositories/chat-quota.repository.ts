export interface ConsumeQuotaAndSaveChatInput {
  userId: string;
  question: string;
  aiAnswer: string;
  tokenUsage: number;
  createdAt: Date;
}

export interface ConsumedQuota {
  source: 'FREE' | 'SUBSCRIPTION';
  subscriptionId: string | null;
}

export interface PersistedChat {
  id: string;
  userId: string;
  question: string;
  aiAnswer: string;
  tokenUsage: number;
  usageSource: 'FREE' | 'SUBSCRIPTION';
  subscriptionId: string | null;
  createdAt: Date;
}

export interface ConsumeQuotaAndSaveChatResult {
  quota: ConsumedQuota;
  chat: PersistedChat;
}

export abstract class ChatQuotaRepository {
  abstract consumeQuotaAndSaveChat(
    input: ConsumeQuotaAndSaveChatInput,
  ): Promise<ConsumeQuotaAndSaveChatResult>;
}