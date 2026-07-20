import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService } from './service'
import { registerContextProvider, clearAllProviders } from './context'

describe('aiService', () => {
  beforeEach(() => {
    clearAllProviders()
    vi.restoreAllMocks()
  })

  describe('chat', () => {
    it('sends request to /api/ai/chat', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          content: 'response',
          confidence: 'high',
          model: 'gpt-4.1-mini',
          provider: 'openai',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      )
      vi.stubGlobal('fetch', mockFetch)

      const result = await aiService.chat({
        operation: 'chat',
        content: 'hello',
      })

      expect(result.content).toBe('response')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const body = JSON.parse((mockFetch.mock.calls[0] as [{}, { body: string }])[1].body)
      expect(body.operation).toBe('chat')
      expect(body.messages).toBeDefined()
    })

    it('includes context contributions in system message', async () => {
      registerContextProvider('test', () => ({
        key: 'test',
        label: 'Test Context',
        priority: 10,
        content: 'Important context data',
      }))

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ content: 'ok', confidence: 'high', model: 'test', provider: 'openai' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', mockFetch)

      await aiService.chat({ operation: 'chat', content: 'hello' })

      const body = JSON.parse((mockFetch.mock.calls[0] as [{}, { body: string }])[1].body)
      const systemMsg = body.messages.find((m: { role: string }) => m.role === 'system')
      expect(systemMsg).toBeDefined()
      expect(systemMsg.content).toContain('Important context data')
      expect(systemMsg.content).toContain('Test Context')
    })

    it('includes page title and selected text', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ content: 'ok', confidence: 'high', model: 'test', provider: 'openai' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', mockFetch)

      await aiService.chat({
        operation: 'explain',
        content: 'explain this',
        pageTitle: 'My Page',
        selectedText: 'some code',
      })

      const body = JSON.parse((mockFetch.mock.calls[0] as [{}, { body: string }])[1].body)
      expect(body.pageTitle).toBe('My Page')
      expect(body.selectedText).toBe('some code')
    })

    it('throws on error response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'No provider' }), { status: 400, headers: { 'Content-Type': 'application/json' } }),
      ))

      await expect(
        aiService.chat({ operation: 'chat', content: 'hello' }),
      ).rejects.toThrow('No provider')
    })

    it('passes through messages from request', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ content: 'ok', confidence: 'high', model: 'test', provider: 'openai' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', mockFetch)

      await aiService.chat({
        operation: 'chat',
        content: 'last message',
        messages: [
          { role: 'user', content: 'previous user message' },
          { role: 'assistant', content: 'previous assistant message' },
        ],
      })

      const body = JSON.parse((mockFetch.mock.calls[0] as [{}, { body: string }])[1].body)
      expect(body.messages).toHaveLength(3)
      expect(body.messages[0].role).toBe('user')
      expect(body.messages[0].content).toBe('previous user message')
      expect(body.messages[1].role).toBe('assistant')
      expect(body.messages[2].role).toBe('user')
    })
  })

  describe('stream', () => {
    it('calls streamChatWithFallback', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()
            controller.enqueue(encoder.encode('data: {"content":"streamed"}\n\n'))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      )

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

      const chunks: string[] = []
      const result = await aiService.stream(
        { operation: 'chat', content: 'hello' },
        { onChunk: (c) => chunks.push(c) },
      )

      expect(result).toBe('streamed')
      expect(chunks).toEqual(['streamed'])
    })
  })
})
