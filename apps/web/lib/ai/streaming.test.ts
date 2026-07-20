import { describe, it, expect, vi } from 'vitest'
import { streamChat, streamChatWithFallback } from './streaming'

function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
}

function createErrorResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('streamChat', () => {
  it('parses SSE chunks and accumulates content', async () => {
    const mockResponse = new Response(createMockStream(['Hello', ' World']), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const chunks: string[] = []
    const result = await streamChat(
      {
        messages: [{ role: 'user', content: 'test' }],
        operation: 'chat',
      },
      {
        onChunk: (chunk) => chunks.push(chunk),
      },
    )

    expect(result).toBe('Hello World')
    expect(chunks).toEqual(['Hello', ' World'])

    vi.restoreAllMocks()
  })

  it('calls onDone with full content', async () => {
    const mockResponse = new Response(createMockStream(['A', 'B']), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    let doneContent = ''
    await streamChat(
      { messages: [{ role: 'user', content: 'test' }], operation: 'chat' },
      { onDone: (c) => { doneContent = c } },
    )

    expect(doneContent).toBe('AB')
    vi.restoreAllMocks()
  })

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createErrorResponse(500, { error: 'Server error' })))

    await expect(
      streamChat({ messages: [{ role: 'user', content: 'test' }], operation: 'chat' }),
    ).rejects.toThrow('Server error')

    vi.restoreAllMocks()
  })

  it('calls onError on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createErrorResponse(500, { error: 'fail' })))

    let caughtError: Error | null = null
    await streamChat(
      { messages: [{ role: 'user', content: 'test' }], operation: 'chat' },
      { onError: (e) => { caughtError = e } },
    ).catch(() => {})

    expect(caughtError).not.toBeNull()
    vi.restoreAllMocks()
  })
})

describe('streamChatWithFallback', () => {
  it('falls back on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createErrorResponse(500, { error: 'fail' })))

    const result = await streamChatWithFallback(
      { messages: [{ role: 'user', content: 'test' }], operation: 'chat' },
      async () => 'fallback response',
    )

    expect(result).toBe('fallback response')
    vi.restoreAllMocks()
  })

  it('returns stream result on success', async () => {
    const mockResponse = new Response(createMockStream(['streamed']), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const result = await streamChatWithFallback(
      { messages: [{ role: 'user', content: 'test' }], operation: 'chat' },
      async () => 'fallback',
    )

    expect(result).toBe('streamed')
    vi.restoreAllMocks()
  })
})
