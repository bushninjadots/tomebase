import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth } from '@/lib/authorization';
import { createProvider } from '@/lib/ai-provider/factory';
import type { AIProviderType } from '@/lib/ai-provider/types';

interface HealthPage {
  id: string;
  title: string;
  content: string;
  slug: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, pages } = body as {
      projectId?: string;
      pages?: HealthPage[];
    };

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Pages array is required and must not be empty' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: { projects: { some: { id: projectId } } },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const config = await prisma.aIProviderConfig.findFirst({
      where: { userId: session.user.id, enabled: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'No AI provider configured. Go to Settings > AI Providers to add your API key.' },
        { status: 400 },
      );
    }

    const provider = createProvider({
      provider: config.provider as AIProviderType,
      apiKey: config.apiKey || undefined,
      baseUrl: config.baseUrl || undefined,
      model: config.model || undefined,
    });

    const combinedContent = pages
      .map((p) => `## ${p.title}\n\n${p.content}`)
      .join('\n\n---\n\n');

    const reviewResult = await provider.review({
      content: combinedContent,
      pageTitle: `Project Health Check`,
      pageSlug: projectId,
    });

    const summarizeResult = await provider.summarize({
      content: combinedContent,
      pageTitle: `Project Health Check`,
      pageSlug: projectId,
    });

    return NextResponse.json({
      projectId,
      overallScore: reviewResult.overallScore,
      issues: reviewResult.issues,
      summary: summarizeResult.summary,
      keyPoints: summarizeResult.keyPoints,
      model: reviewResult.model,
      provider: reviewResult.provider,
      tokensUsed: {
        input:
          (reviewResult.tokensUsed?.input ?? 0) + (summarizeResult.tokensUsed?.input ?? 0),
        output:
          (reviewResult.tokensUsed?.output ?? 0) + (summarizeResult.tokensUsed?.output ?? 0),
      },
    });
  } catch (error) {
    console.error('AI health analysis error:', error);
    return NextResponse.json(
      { error: `Health analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}
