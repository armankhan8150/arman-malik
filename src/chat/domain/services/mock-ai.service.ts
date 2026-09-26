export interface MockAiResponse {
  answer: string;
  tokenUsage: number;
}

export class MockAiService {
  private static readonly MIN_LATENCY_MS = 200;
  private static readonly MAX_LATENCY_MS = 600;

  async generateResponse(question: string): Promise<MockAiResponse> {
    await this.simulateLatency();

    const answer = `Mock AI response to: ${question}`;

    return {
      answer,
      tokenUsage: this.estimateTokenUsage(question, answer),
    };
  }

  private async simulateLatency(): Promise<void> {
    const latency =
      MockAiService.MIN_LATENCY_MS +
      Math.floor(
        Math.random() *
          (MockAiService.MAX_LATENCY_MS -
            MockAiService.MIN_LATENCY_MS +
            1),
      );

    await new Promise<void>((resolve) => {
      setTimeout(resolve, latency);
    });
  }

  private estimateTokenUsage(question: string, answer: string): number {
    const combinedText = `${question} ${answer}`.trim();

    if (!combinedText) {
      return 0;
    }

    return combinedText.split(/\s+/).length;
  }
}