import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { getActiveProviderConfig, createProviderFromConfig, buildContextForPrompt } from '@/lib/workspace';
import type { AIChatMessage, AIRequest } from '@/lib/ai-provider/types';
import type { Diagnostic } from '@fluid/types';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, projectId, messages, operation, content, selectedText, diagnostic } = body as {
      pageId?: string;
      projectId?: string;
      messages?: AIChatMessage[];
      operation?: string;
      content?: string;
      selectedText?: string;
      diagnostic?: Diagnostic;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required and must not be empty' }, { status: 400 });
    }

    const config = await getActiveProviderConfig(session.user.id);
    if (!config) {
      return NextResponse.json(
        { error: 'No AI provider configured. Go to Settings > AI Providers to add your API key.' },
        { status: 400 },
      );
    }

    const provider = createProviderFromConfig(config);

    const userMessage = messages.find((m) => m.role === 'user')?.content || '';
    const contextString = await buildContextForPrompt({
      pageId,
      projectId,
      content: content || undefined,
      userMessage,
    });

    const aiRequest: AIRequest = {
      content: contextString || content || '',
      pageTitle: undefined,
      pageSlug: undefined,
      selectedText,
      diagnostic,
    };

    if (contextString && operation !== 'chat') {
      aiRequest.content = contextString;
      if (selectedText) {
        aiRequest.selectedText = selectedText;
      }
    }

    const chatRequest = {
      messages: messages.map((m) => {
        if (contextString && m.role === 'user' && messages.indexOf(m) === 0) {
          return {
            role: m.role as 'user' | 'assistant' | 'system',
            content: `${contextString}\n\n---\n\n${m.content}`,
          };
        }
        return { role: m.role as 'user' | 'assistant' | 'system', content: m.content };
      }),
      context: contextString || content,
    };

    let result;

    switch (operation) {
      case 'explain':
        result = await provider.explain(aiRequest);
        break;
      case 'fix':
        result = await provider.fix(aiRequest);
        break;
      case 'rewrite':
        result = await provider.rewrite(aiRequest);
        break;
      case 'generate':
        result = await provider.generate(aiRequest);
        break;
      case 'review':
        result = await provider.review(aiRequest);
        break;
      case 'summarize':
        result = await provider.summarize(aiRequest);
        break;
      case 'improve':
        result = await provider.improve(aiRequest);
        break;
      default:
        result = await provider.chat(chatRequest);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: `AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}
