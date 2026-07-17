import type {
  AIProvider,
  AIProviderCapabilities,
  AIProviderConfig,
  AIProviderType,
  AIRequest,
  AIExplainResponse,
  AIFixResponse,
  AIRewriteResponse,
  AIGenerateResponse,
  AIReviewResponse,
  AISummarizeResponse,
  AIImproveResponse,
  AIChatRequest,
  AIChatResponse,
  AIStreamRequest,
} from './types';

const UNAVAILABLE_MESSAGE = 'No AI provider configured. Connect an AI provider to enable this feature.';

function unavailable(): never {
  throw new AIUnavailableError(UNAVAILABLE_MESSAGE);
}

export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

const FULL_CAPABILITIES: AIProviderCapabilities = {
  canExplain: false,
  canFix: false,
  canRewrite: false,
  canGenerate: false,
  canReview: false,
  canSummarize: false,
  canImprove: false,
  canChat: false,
};

export class NullAIProvider implements AIProvider {
  readonly type: AIProviderType = 'null';
  readonly capabilities = FULL_CAPABILITIES;
  readonly isAvailable = false;
  readonly config: AIProviderConfig = { provider: 'null' };

  async explain(_request: AIRequest): Promise<AIExplainResponse> {
    unavailable();
  }

  async fix(_request: AIRequest): Promise<AIFixResponse> {
    unavailable();
  }

  async rewrite(_request: AIRequest): Promise<AIRewriteResponse> {
    unavailable();
  }

  async generate(_request: AIRequest): Promise<AIGenerateResponse> {
    unavailable();
  }

  async review(_request: AIRequest): Promise<AIReviewResponse> {
    unavailable();
  }

  async summarize(_request: AIRequest): Promise<AISummarizeResponse> {
    unavailable();
  }

  async improve(_request: AIRequest): Promise<AIImproveResponse> {
    unavailable();
  }

  async chat(_request: AIChatRequest): Promise<AIChatResponse> {
    unavailable();
  }

  async *streamChat(_request: AIStreamRequest): AsyncGenerator<string> {
    unavailable();
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    return { success: false, message: UNAVAILABLE_MESSAGE };
  }
}

export function createNullProvider(): NullAIProvider {
  return new NullAIProvider();
}
