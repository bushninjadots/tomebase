import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { getActiveProviderConfig, createProviderFromConfig, buildContextForPrompt } from '@/lib/workspace';
import type { AIStreamRequest, AIChatMessage } from '@/lib/ai-provider/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let providerType = 'unknown';
  let model = 'unknown';

  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { pageId, projectId, content, selectedText, messages, temperature, maxTokens } = body as {
      pageId?: string;
      projectId?: string;
      content?: string;
      selectedText?: string;
      messages?: AIChatMessage[];
      temperature?: number;
      maxTokens?: number;
    };

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const config = await getActiveProviderConfig(session.user.id);
    if (!config) {
      return new Response(JSON.stringify({ error: 'No AI provider configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const provider = createProviderFromConfig(config);
    providerType = config.provider;
    model = config.model || 'default';

    const contextString = await buildContextForPrompt({
      pageId,
      projectId,
      content,
    });

    // Build conversation history for multi-turn streaming
    const historyParts: string[] = [];
    if (messages && messages.length > 1) {
      for (const msg of messages.slice(0, -1)) {
        historyParts.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`);
      }
    }

    const lastUserMessage = messages && messages.length > 0
      ? messages[messages.length - 1]!.content
      : content;

    const systemPrompt = `You are an expert technical writer and documentation assistant for TomeBase. You help developers write, improve, and maintain high-quality technical documentation.

Documentation Context:
${contextString}
${historyParts.length > 0 ? `\nConversation History:\n${historyParts.join('\n')}` : ''}

Respond to the user's latest message using the documentation context above.`;

    const streamRequest: AIStreamRequest = {
      content: contextString ? `${contextString}\n\n---\n\n${lastUserMessage}` : lastUserMessage,
      selectedText,
      systemPrompt,
      temperature,
      maxTokens,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = provider.streamChat(streamRequest);
          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          const latency = Date.now() - startTime;
          console.log(`[AI] ${providerType}/${model} stream latency=${latency}ms promptLen=${(contextString || content || '').length}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
