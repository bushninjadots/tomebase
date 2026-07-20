import type { AIRequest, AIResponse, AIMessage, AIOperation } from './types'
import { collectContext, contributionsToString } from './context'
import { streamChatWithFallback } from './streaming'

export interface AIServiceConfig {
  apiBase?: string
}

class AIService {
  private config: AIServiceConfig = {}

  configure(config: AIServiceConfig): void {
    this.config = config
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const messages = await this.buildMessages(request)

    const response = await fetch(`${this.config.apiBase ?? ''}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: request.operation,
        content: request.content,
        messages,
        pageId: request.pageId,
        projectId: request.projectId,
        pageTitle: request.pageTitle,
        selectedText: request.selectedText,
        diagnostic: request.diagnostic,
        language: request.language,
        systemPrompt: request.systemPrompt,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'AI request failed' }))
      throw new Error(err.error || 'AI request failed')
    }

    return await response.json()
  }

  async stream(
    request: AIRequest,
    callbacks: {
      onChunk?: (chunk: string, fullContent: string) => void
      onDone?: (fullContent: string) => void
      onError?: (error: Error) => void
      signal?: AbortSignal
    } = {},
  ): Promise<string> {
    const messages = await this.buildMessages(request)

    return streamChatWithFallback(
      {
        messages,
        operation: request.operation,
        pageId: request.pageId,
        projectId: request.projectId,
        selectedText: request.selectedText,
        content: request.content,
        signal: callbacks.signal,
      },
      async () => {
        const result = await this.chat(request)
        return result.content || result.message || ''
      },
      {
        onChunk: callbacks.onChunk,
        onDone: callbacks.onDone,
        onError: callbacks.onError,
      },
    )
  }

  private async buildMessages(request: AIRequest): Promise<AIMessage[]> {
    const messages: AIMessage[] = []

    const contextContributions = await collectContext()
    const contextString = contributionsToString(contextContributions)

    const systemParts: string[] = []
    if (request.systemPrompt) systemParts.push(request.systemPrompt)
    if (contextString) systemParts.push(contextString)
    if (systemParts.length > 0) {
      messages.push({ role: 'system', content: systemParts.join('\n\n') })
    }

    if (request.messages) {
      messages.push(...request.messages)
    }

    if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
      const userContent = this.buildUserContent(request)
      messages.push({ role: 'user', content: userContent })
    }

    return messages
  }

  private buildUserContent(request: AIRequest): string {
    const parts: string[] = []

    if (request.context) parts.push(request.context)
    if (request.pageTitle) parts.push(`Page: "${request.pageTitle}"`)
    if (request.selectedText) parts.push(`Selected text: "${request.selectedText}"`)
    if (request.diagnostic) {
      parts.push(`Diagnostic: ${request.diagnostic.title} (${request.diagnostic.severity})`)
      if (request.diagnostic.description) parts.push(`Details: ${request.diagnostic.description}`)
    }
    if (request.content) parts.push(request.content)

    return parts.join('\n') || 'Hello'
  }
}

export const aiService = new AIService()
