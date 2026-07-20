import type { AIMessage, AIStreamCallbacks, AIOperation } from './types'

export interface StreamRequest {
  messages: AIMessage[]
  operation: AIOperation
  pageId?: string
  projectId?: string
  selectedText?: string
  content?: string
  signal?: AbortSignal
}

export async function streamChat(
  request: StreamRequest,
  callbacks: AIStreamCallbacks = {},
): Promise<string> {
  const { onChunk, onDone, onError } = callbacks
  let fullContent = ''

  try {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages,
        operation: request.operation,
        pageId: request.pageId,
        projectId: request.projectId,
        selectedText: request.selectedText,
        content: request.content,
      }),
      signal: request.signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Stream request failed' }))
      throw new Error(err.error || 'AI request failed')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.content) {
            fullContent += parsed.content
            onChunk?.(parsed.content, fullContent)
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue
          throw e
        }
      }
    }

    onDone?.(fullContent)
    return fullContent
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      onDone?.(fullContent)
      return fullContent
    }
    onError?.(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

export async function streamChatWithFallback(
  request: StreamRequest,
  fallback: () => Promise<string>,
  callbacks: AIStreamCallbacks = {},
): Promise<string> {
  try {
    return await streamChat(request, callbacks)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return callbacks.onDone?.('') ?? ''
    }
    return await fallback()
  }
}
