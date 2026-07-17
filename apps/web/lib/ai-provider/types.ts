import type { Diagnostic, DiagnosticCategory, DiagnosticSeverity } from '@fluid/types';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export type AIProviderType =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'ollama'
  | 'local'
  | 'null';

export interface AIProviderCapabilities {
  canExplain: boolean;
  canFix: boolean;
  canRewrite: boolean;
  canGenerate: boolean;
  canReview: boolean;
  canSummarize: boolean;
  canImprove: boolean;
}

export interface AIExplainRequest {
  diagnostic: Diagnostic;
  pageContent: string;
  pageTitle: string;
}

export interface AIExplainResponse {
  explanation: string;
  suggestions: string[];
}

export interface AIFixRequest {
  diagnostic: Diagnostic;
  pageContent: string;
  pageTitle: string;
}

export interface AIFixResponse {
  fixedContent: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AIRewriteRequest {
  pageContent: string;
  pageTitle: string;
  instructions?: string;
}

export interface AIRewriteResponse {
  rewrittenContent: string;
  description: string;
}

export interface AIGenerateRequest {
  pageTitle: string;
  projectContext: string;
  existingPages: string[];
}

export interface AIGenerateResponse {
  content: string;
  description: string;
}

export interface AIReviewRequest {
  pageContent: string;
  pageTitle: string;
  projectContext?: string;
}

export interface AIReviewResponse {
  issues: Array<{
    category: DiagnosticCategory;
    severity: DiagnosticSeverity;
    title: string;
    description: string;
    line: number | null;
  }>;
  overallAssessment: string;
  suggestions: string[];
}

export interface AISummarizeRequest {
  pageContent: string;
  pageTitle: string;
}

export interface AISummarizeResponse {
  summary: string;
  keyPoints: string[];
}

export interface AIImproveRequest {
  pageContent: string;
  pageTitle: string;
  focus?: 'readability' | 'completeness' | 'structure' | 'all';
}

export interface AIImproveResponse {
  improvedContent: string;
  changes: string[];
}

export interface AIProvider {
  readonly type: AIProviderType;
  readonly capabilities: AIProviderCapabilities;
  readonly isAvailable: boolean;

  explain(request: AIExplainRequest): Promise<AIExplainResponse>;
  fix(request: AIFixRequest): Promise<AIFixResponse>;
  rewrite(request: AIRewriteRequest): Promise<AIRewriteResponse>;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
  review(request: AIReviewRequest): Promise<AIReviewResponse>;
  summarize(request: AISummarizeRequest): Promise<AISummarizeResponse>;
  improve(request: AIImproveRequest): Promise<AIImproveResponse>;
}
