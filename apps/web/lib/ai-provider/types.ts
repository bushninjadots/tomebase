import type { Diagnostic } from '@fluid/types';

// ─── Provider Types ──────────────────────────────────────────────

export type AIProviderType =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'azure'
  | 'ollama'
  | 'lmstudio'
  | 'custom'
  | 'null';

export interface AIProviderMeta {
  type: AIProviderType;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  models: AIModelInfo[];
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  isLocal: boolean;
  supportsStreaming: boolean;
}

export interface AIModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

// ─── Provider Config ─────────────────────────────────────────────

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  customHeaders?: Record<string, string>;
}

// ─── Provider Capabilities ───────────────────────────────────────

export interface AIProviderCapabilities {
  canExplain: boolean;
  canFix: boolean;
  canRewrite: boolean;
  canGenerate: boolean;
  canReview: boolean;
  canSummarize: boolean;
  canImprove: boolean;
  canChat: boolean;
}

// ─── Request/Response Types ──────────────────────────────────────

export interface AIRequest {
  content: string;
  pageTitle?: string;
  pageSlug?: string;
  selectedText?: string;
  context?: string;
  diagnostic?: Diagnostic;
  language?: string;
}

export interface AIStreamRequest extends AIRequest {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  confidence: 'high' | 'medium' | 'low';
  model: string;
  provider: AIProviderType;
  tokensUsed?: { input: number; output: number };
}

export interface AIExplainResponse extends AIResponse {
  explanation: string;
  suggestions: string[];
}

export interface AIFixResponse extends AIResponse {
  fixedContent: string;
  description: string;
}

export interface AIRewriteResponse extends AIResponse {
  rewrittenContent: string;
  changes: string[];
}

export interface AIGenerateResponse extends AIResponse {
  generatedContent: string;
}

export interface AIReviewResponse extends AIResponse {
  overallScore: number;
  issues: Array<{ severity: string; description: string; suggestion: string }>;
}

export interface AISummarizeResponse extends AIResponse {
  summary: string;
  keyPoints: string[];
}

export interface AIImproveResponse extends AIResponse {
  improvedContent: string;
  improvements: string[];
}

// ─── Chat Types ──────────────────────────────────────────────────

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIChatResponse extends AIResponse {
  message: string;
}

// ─── Provider Interface ──────────────────────────────────────────

export interface AIProvider {
  type: AIProviderType;
  capabilities: AIProviderCapabilities;
  isAvailable: boolean;
  config: AIProviderConfig;

  explain(request: AIRequest): Promise<AIExplainResponse>;
  fix(request: AIRequest): Promise<AIFixResponse>;
  rewrite(request: AIRequest): Promise<AIRewriteResponse>;
  generate(request: AIRequest): Promise<AIGenerateResponse>;
  review(request: AIRequest): Promise<AIReviewResponse>;
  summarize(request: AIRequest): Promise<AISummarizeResponse>;
  improve(request: AIRequest): Promise<AIImproveResponse>;
  chat(request: AIChatRequest): Promise<AIChatResponse>;
  streamChat(request: AIStreamRequest): AsyncGenerator<string>;
  testConnection(): Promise<{ success: boolean; message: string; model?: string }>;
}

// ─── Stored Config (database shape) ──────────────────────────────

export interface StoredAIProviderConfig {
  id: string;
  provider: AIProviderType;
  apiKeyHint: string | null;
  model: string | null;
  baseUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── All Provider Metadata ───────────────────────────────────────

export const AI_PROVIDERS: AIProviderMeta[] = [
  {
    type: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4.1, o3, and more',
    logoUrl: '/ai/openai.svg',
    websiteUrl: 'https://platform.openai.com',
    requiresApiKey: true,
    requiresBaseUrl: false,
    isLocal: false,
    supportsStreaming: true,
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1', contextWindow: 1047576, maxOutput: 32768, supportsStreaming: true, supportsVision: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', contextWindow: 1047576, maxOutput: 32768, supportsStreaming: true, supportsVision: true },
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutput: 16384, supportsStreaming: true, supportsVision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxOutput: 16384, supportsStreaming: true, supportsVision: true },
      { id: 'o3', name: 'o3', contextWindow: 200000, maxOutput: 100000, supportsStreaming: true, supportsVision: true },
      { id: 'o4-mini', name: 'o4-mini', contextWindow: 200000, maxOutput: 100000, supportsStreaming: true, supportsVision: true },
    ],
  },
  {
    type: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Opus, Sonnet, and Haiku',
    logoUrl: '/ai/anthropic.svg',
    websiteUrl: 'https://console.anthropic.com',
    requiresApiKey: true,
    requiresBaseUrl: false,
    isLocal: false,
    supportsStreaming: true,
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, maxOutput: 64000, supportsStreaming: true, supportsVision: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, maxOutput: 8192, supportsStreaming: true, supportsVision: true },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, maxOutput: 8192, supportsStreaming: true, supportsVision: false },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', contextWindow: 200000, maxOutput: 32000, supportsStreaming: true, supportsVision: true },
    ],
  },
  {
    type: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.5 Pro, Flash, and more',
    logoUrl: '/ai/gemini.svg',
    websiteUrl: 'https://aistudio.google.com',
    requiresApiKey: true,
    requiresBaseUrl: false,
    isLocal: false,
    supportsStreaming: true,
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1048576, maxOutput: 65536, supportsStreaming: true, supportsVision: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1048576, maxOutput: 65536, supportsStreaming: true, supportsVision: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1048576, maxOutput: 8192, supportsStreaming: true, supportsVision: true },
    ],
  },
  {
    type: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 100+ models with one API key',
    logoUrl: '/ai/openrouter.svg',
    websiteUrl: 'https://openrouter.ai',
    requiresApiKey: true,
    requiresBaseUrl: false,
    isLocal: false,
    supportsStreaming: true,
    models: [
      { id: 'openai/gpt-4.1', name: 'GPT-4.1 (via OpenRouter)', contextWindow: 1047576, maxOutput: 32768, supportsStreaming: true, supportsVision: true },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4 (via OpenRouter)', contextWindow: 200000, maxOutput: 64000, supportsStreaming: true, supportsVision: true },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (via OpenRouter)', contextWindow: 1048576, maxOutput: 65536, supportsStreaming: true, supportsVision: true },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick (via OpenRouter)', contextWindow: 1048576, maxOutput: 32768, supportsStreaming: true, supportsVision: true },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (via OpenRouter)', contextWindow: 163840, maxOutput: 163840, supportsStreaming: true, supportsVision: false },
    ],
  },
  {
    type: 'azure',
    name: 'Azure OpenAI',
    description: 'Enterprise OpenAI via Microsoft Azure',
    logoUrl: '/ai/azure.svg',
    websiteUrl: 'https://azure.microsoft.com/ai-services',
    requiresApiKey: true,
    requiresBaseUrl: true,
    isLocal: false,
    supportsStreaming: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Azure)', contextWindow: 128000, maxOutput: 16384, supportsStreaming: true, supportsVision: true },
      { id: 'gpt-4', name: 'GPT-4 (Azure)', contextWindow: 8192, maxOutput: 4096, supportsStreaming: true, supportsVision: false },
      { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo (Azure)', contextWindow: 16385, maxOutput: 4096, supportsStreaming: true, supportsVision: false },
    ],
  },
  {
    type: 'ollama',
    name: 'Ollama',
    description: 'Run AI models locally on your machine',
    logoUrl: '/ai/ollama.svg',
    websiteUrl: 'https://ollama.ai',
    requiresApiKey: false,
    requiresBaseUrl: false,
    isLocal: true,
    supportsStreaming: true,
    models: [
      { id: 'llama3.1', name: 'Llama 3.1', contextWindow: 128000, maxOutput: 4096, supportsStreaming: true, supportsVision: false },
      { id: 'llama3.2', name: 'Llama 3.2', contextWindow: 128000, maxOutput: 4096, supportsStreaming: true, supportsVision: false },
      { id: 'codellama', name: 'CodeLlama', contextWindow: 16000, maxOutput: 4096, supportsStreaming: true, supportsVision: false },
      { id: 'mistral', name: 'Mistral', contextWindow: 32000, maxOutput: 8192, supportsStreaming: true, supportsVision: false },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', contextWindow: 32000, maxOutput: 8192, supportsStreaming: true, supportsVision: false },
      { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', contextWindow: 128000, maxOutput: 8192, supportsStreaming: true, supportsVision: false },
    ],
  },
  {
    type: 'lmstudio',
    name: 'LM Studio',
    description: 'Desktop app for running local LLMs',
    logoUrl: '/ai/lmstudio.svg',
    websiteUrl: 'https://lmstudio.ai',
    requiresApiKey: false,
    requiresBaseUrl: true,
    isLocal: true,
    supportsStreaming: true,
    models: [
      { id: 'local-model', name: 'Local Model (via LM Studio)', contextWindow: 32000, maxOutput: 4096, supportsStreaming: true, supportsVision: false },
    ],
  },
  {
    type: 'custom',
    name: 'Custom Endpoint',
    description: 'Any OpenAI-compatible API (vLLM, text-generation-webui, etc.)',
    logoUrl: '/ai/custom.svg',
    websiteUrl: '',
    requiresApiKey: false,
    requiresBaseUrl: true,
    isLocal: false,
    supportsStreaming: true,
    models: [
      { id: 'custom-model', name: 'Custom Model', contextWindow: 32000, maxOutput: 4096, supportsStreaming: true, supportsVision: false },
    ],
  },
];

export function getProviderMeta(type: AIProviderType): AIProviderMeta | undefined {
  return AI_PROVIDERS.find((p) => p.type === type);
}

export function getLocalProviders(): AIProviderMeta[] {
  return AI_PROVIDERS.filter((p) => p.isLocal);
}

export function getCloudProviders(): AIProviderMeta[] {
  return AI_PROVIDERS.filter((p) => !p.isLocal);
}
