import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { getActiveProviderConfig, createProviderFromConfig, buildContextForPrompt } from '@/lib/workspace';
import type { AIStreamRequest } from '@/lib/ai-provider/types';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { pageId, projectId, content, selectedText, temperature, maxTokens } = body as {
      pageId?: string;
      projectId?: string;
      content?: string;
      selectedText?: string;
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

    const contextString = await buildContextForPrompt({
      pageId,
      projectId,
      content,
    });

    const streamRequest: AIStreamRequest = {
      content: contextString,
      selectedText,
      systemPrompt: `You are an expert technical writer and documentation assistant for TomeBase. You help developers write, improve, and maintain high-quality technical documentation.

Context:
${contextString}

User query: ${content}`,
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
