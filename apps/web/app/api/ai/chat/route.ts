import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth } from '@/lib/authorization';
import { createProvider } from '@/lib/ai-provider/factory';
import { buildAIContext, contextToString } from '@/lib/ai-context';
import { queryIndex, getContextForQuery } from '@/lib/repository-index/query';
import { buildIndexForProject } from '@/lib/repository-index/builder';
import type { AIProviderType, AIChatMessage, AIRequest } from '@/lib/ai-provider/types';
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

    const config = await prisma.aIProviderConfig.findFirst({
      where: { userId: session.user.id, enabled: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      return NextResponse.json(
        {
          error: 'No AI provider configured. Go to Settings > AI Providers to add your API key.',
        },
        { status: 400 },
      );
    }

    const provider = createProvider({
      provider: config.provider as AIProviderType,
      apiKey: config.apiKey || undefined,
      baseUrl: config.baseUrl || undefined,
      model: config.model || undefined,
    });

    // Build rich context if pageId and projectId are provided
    let contextString = '';
    if (pageId && projectId) {
      try {
        const ctx = await buildAIContext({
          projectId,
          pageId,
          content: content || undefined,
        });
        contextString = contextToString(ctx);

        // Enrich with repository index context
        try {
          const userMessage = messages?.find((m) => m.role === 'user')?.content || '';
          const indexContext = await getContextForQuery(projectId, pageId, userMessage);
          if (indexContext) {
            contextString += `\n\nREPOSITORY INDEX:\n${indexContext}`;
          }
        } catch {
          // Index may not exist yet
        }
      } catch {
        // Fallback to basic context
        contextString = content || '';
      }
    } else if (pageId) {
      // Try to find project from page
      const page = await prisma.docPage.findUnique({
        where: { id: pageId },
        select: { projectId: true, title: true, content: true },
      });
      if (page) {
        try {
          const ctx = await buildAIContext({
            projectId: page.projectId,
            pageId,
            content: content || undefined,
          });
          contextString = contextToString(ctx);

          try {
            const userMessage = messages?.find((m) => m.role === 'user')?.content || '';
            const indexContext = await getContextForQuery(page.projectId, pageId, userMessage);
            if (indexContext) {
              contextString += `\n\nREPOSITORY INDEX:\n${indexContext}`;
            }
          } catch {
            // Index may not exist
          }
        } catch {
          contextString = content || '';
        }
      } else {
        contextString = content || '';
      }
    } else {
      contextString = content || '';
    }

    const aiRequest: AIRequest = {
      content: contextString || content || '',
      pageTitle: undefined,
      pageSlug: undefined,
      selectedText,
      diagnostic,
    };

    // If we have context, override the content for non-chat operations
    if (contextString && operation !== 'chat') {
      aiRequest.content = contextString;
      if (selectedText) {
        aiRequest.selectedText = selectedText;
      }
    }

    const chatRequest = {
      messages: messages.map((m) => {
        // Inject context into the first system or user message if it doesn't already have context
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
