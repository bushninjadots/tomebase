import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth } from '@/lib/authorization';
import { createProvider } from '@/lib/ai-provider/factory';
import type { AIProviderType, AIChatMessage, AIRequest } from '@/lib/ai-provider/types';
import type { Diagnostic } from '@fluid/types';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, messages, operation, content, selectedText, diagnostic } = body as {
      pageId?: string;
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

    let pageTitle: string | undefined;
    let pageSlug: string | undefined;

    if (pageId) {
      const page = await prisma.docPage.findUnique({
        where: { id: pageId },
        select: { title: true, slug: true },
      });
      if (page) {
        pageTitle = page.title;
        pageSlug = page.slug;
      }
    }

    const aiRequest = {
      content: content || '',
      pageTitle,
      pageSlug,
      selectedText,
      diagnostic,
    };

    const chatRequest = {
      messages,
      context: content,
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
