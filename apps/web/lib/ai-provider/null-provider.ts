import type {
  AIProvider,
  AIProviderCapabilities,
  AIExplainRequest,
  AIExplainResponse,
  AIFixRequest,
  AIFixResponse,
  AIRewriteRequest,
  AIRewriteResponse,
  AIGenerateRequest,
  AIGenerateResponse,
  AIReviewRequest,
  AIReviewResponse,
  AISummarizeRequest,
  AISummarizeResponse,
  AIImproveRequest,
  AIImproveResponse,
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
};

export class NullAIProvider implements AIProvider {
  readonly type = 'null' as const;
  readonly capabilities = FULL_CAPABILITIES;
  readonly isAvailable = false;

  async explain(_request: AIExplainRequest): Promise<AIExplainResponse> {
    unavailable();
  }

  async fix(_request: AIFixRequest): Promise<AIFixResponse> {
    unavailable();
  }

  async rewrite(_request: AIRewriteRequest): Promise<AIRewriteResponse> {
    unavailable();
  }

  async generate(_request: AIGenerateRequest): Promise<AIGenerateResponse> {
    unavailable();
  }

  async review(_request: AIReviewRequest): Promise<AIReviewResponse> {
    unavailable();
  }

  async summarize(_request: AISummarizeRequest): Promise<AISummarizeResponse> {
    unavailable();
  }

  async improve(_request: AIImproveRequest): Promise<AIImproveResponse> {
    unavailable();
  }
}

export function createNullProvider(): NullAIProvider {
  return new NullAIProvider();
}
