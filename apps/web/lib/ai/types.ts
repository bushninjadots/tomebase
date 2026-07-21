import type { Diagnostic } from '@fluid/types'
import type {
  AIProviderType,
  AIProviderConfig,
  StoredAIProviderConfig,
  AIProviderMeta,
} from '@/lib/ai-provider/types'

export type { AIProviderType, AIProviderConfig, StoredAIProviderConfig, AIProviderMeta }

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
