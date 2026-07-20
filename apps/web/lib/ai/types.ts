import type { Diagnostic } from '@fluid/types'

// ─── Provider ───────────────────────────────────────────────────

export type AIProviderType =
  | 'openai' | 'anthropic' | 'gemini' | 'openrouter'
  | 'azure' | 'ollama' | 'lmstudio' | 'custom' | 'null'

export interface AIProviderConfig {
  provider: AIProviderType
  apiKey?: string
  baseUrl?: string
  model?: string
  customHeaders?: Record<string, string>
}

export interface StoredAIProviderConfig {
  id: string
  provider: AIProviderType
  apiKeyHint: string
  model: string | null
  baseUrl: string | null
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Messages ───────────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ─── Operations ─────────────────────────────────────────────────

export type AIOperation =
  | 'chat' | 'explain' | 'fix' | 'rewrite'
  | 'generate' | 'review' | 'summarize' | 'improve'

// ─── Requests ───────────────────────────────────────────────────

export interface AIRequest {
  operation: AIOperation
  content: string
  messages?: AIMessage[]
  pageTitle?: string
  pageSlug?: string
  pageId?: string
  projectId?: string
  selectedText?: string
  context?: string
  diagnostic?: Diagnostic
  language?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

// ─── Responses ──────────────────────────────────────────────────

export interface AIResponse {
  content: string
  confidence: 'high' | 'medium' | 'low'
  model: string
  provider: AIProviderType
  tokensUsed?: number
  message?: string
}

// ─── Streaming ──────────────────────────────────────────────────

export interface AIStreamCallbacks {
  onChunk?: (chunk: string, fullContent: string) => void
  onDone?: (fullContent: string) => void
  onError?: (error: Error) => void
}

// ─── Context ────────────────────────────────────────────────────

export interface AIContextContribution {
  key: string
  label: string
  priority: number
  content: string
}

export type AIContextProvider = () => AIContextContribution | null | Promise<AIContextContribution | null>

// ─── Provider Info ──────────────────────────────────────────────

export interface AIProviderMeta {
  name: string
  type: AIProviderType
  description: string
  models: Array<{ id: string; name: string; contextWindow: number; maxOutput: number }>
  requiresApiKey: boolean
  requiresBaseUrl: boolean
  isLocal: boolean
}
