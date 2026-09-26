export interface SaveChatInput {
  userId: string;
  question: string;
  aiAnswer: string;
  tokenUsage: number;
  usageSource: 'FREE' | 'SUBSCRIPTION';
  subscriptionId: string | null;
  createdAt: Date;
}

export interface SavedChat {
  id: string;
  userId: string;
  question: string;
  aiAnswer: string;
  tokenUsage: number;
  usageSource: 'FREE' | 'SUBSCRIPTION';
  subscriptionId: string | null;
  createdAt: Date;
}

export abstract class ChatRepository {
  abstract save(input: SaveChatInput): Promise<SavedChat>;
}