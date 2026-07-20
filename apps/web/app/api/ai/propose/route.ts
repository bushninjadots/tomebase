import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { proposalService, validateProposalInput, type ChangeType } from '@/lib/ai/proposals';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { eventBus } from '@/lib/events';
import { logActivity } from '@/lib/activity';
import { getActiveProviderConfig, createProviderFromConfig } from '@/lib/workspace';

interface ProposeRequest {
  pageId: string;
  instruction: string;
  selectedText?: string;
  context?: string;
  sourceRuleId?: string;
}

function sanitizeContent(content: string): string {
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function parseAIResponse(response: string): {
  changeType: ChangeType;
  originalContent: string;
  proposedContent: string;
  explanation: string;
  confidence: number;
} | null {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    const parsed = JSON.parse(jsonStr!);

    if (!parsed.type || !['replace', 'insert', 'delete'].includes(parsed.type)) return null;
    if (typeof parsed.proposedContent !== 'string') return null;
    if (typeof parsed.explanation !== 'string') return null;

    return {
      changeType: parsed.type as ChangeType,
      originalContent: typeof parsed.originalContent === 'string' ? parsed.originalContent : '',
      proposedContent: parsed.proposedContent,
      explanation: parsed.explanation,
      confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`ai-propose:${session.user.id}`, 10, 60_000);
    const rlResponse = rateLimitResponse(rateLimit);
    if (rlResponse) return rlResponse;

    const body: ProposeRequest = await request.json();
    const { pageId, instruction, selectedText, context, sourceRuleId } = body;

    if (!pageId || typeof pageId !== 'string') {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }
    if (!instruction || typeof instruction !== 'string' || instruction.length > 2000) {
      return NextResponse.json({ error: 'instruction is required (max 2000 chars)' }, { status: 400 });
    }

    const page = await prisma.docPage.findFirst({
      where: {
        id: pageId,
        project: { team: { members: { some: { userId: session.user.id } } } },
      },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.content.length > 200_000) {
      return NextResponse.json({ error: 'Page content too large for AI processing' }, { status: 400 });
    }

    const config = await getActiveProviderConfig(session.user.id);
    if (!config) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 400 });
    }

    const provider = createProviderFromConfig(config);

    const systemPrompt = `You are a documentation improvement assistant. You MUST respond with a single JSON object (no other text) in this exact format:

{
  "type": "replace" | "insert" | "delete",
  "originalContent": "the exact text to replace (for replace/delete) or empty string (for insert)",
  "proposedContent": "the improved text to insert or replace with (empty string for delete)",
  "explanation": "brief explanation of what changed and why",
  "confidence": 0.0-1.0
}

Rules:
- For "replace": originalContent is the text to find, proposedContent is the replacement
- For "insert": originalContent is empty, proposedContent is the new content to add
- For "delete": originalContent is the text to remove, proposedContent is empty
- Keep changes focused and minimal
- Preserve markdown formatting
- confidence reflects how sure you are this is an improvement`;

    const userMessage = selectedText
      ? `Page content:\n${page.content}\n\nSelected text to improve:\n${selectedText}\n\nInstruction: ${instruction}`
      : `Page content:\n${page.content}\n\nInstruction: ${instruction}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    const result = await provider.chat({
      messages,
      maxTokens: 2000,
      temperature: 0.3,
    });

    const parsed = parseAIResponse(result.content);
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI response could not be parsed as a valid change proposal' },
        { status: 422 },
      );
    }

    const originalClean = sanitizeContent(parsed.originalContent);
    const proposedClean = sanitizeContent(parsed.proposedContent);

    if (parsed.changeType === 'replace' && !originalClean) {
      return NextResponse.json(
        { error: 'Replace proposal must include originalContent' },
        { status: 422 },
      );
    }
    if (parsed.changeType === 'insert' && !proposedClean) {
      return NextResponse.json(
        { error: 'Insert proposal must include proposedContent' },
        { status: 422 },
      );
    }
    if (parsed.changeType === 'delete' && !originalClean) {
      return NextResponse.json(
        { error: 'Delete proposal must include originalContent' },
        { status: 422 },
      );
    }

    if (parsed.changeType === 'replace' && !page.content.includes(originalClean)) {
      return NextResponse.json(
        { error: 'Original content not found in document' },
        { status: 422 },
      );
    }
    if (parsed.changeType === 'delete' && !page.content.includes(originalClean)) {
      return NextResponse.json(
        { error: 'Content to delete not found in document' },
        { status: 422 },
      );
    }

    const proposal = await proposalService.create({
      pageId,
      userId: session.user.id,
      changeType: parsed.changeType,
      originalContent: originalClean,
      proposedContent: proposedClean,
      explanation: parsed.explanation,
      confidence: parsed.confidence,
      source: sourceRuleId ? 'health' : 'ai',
      sourceRuleId,
    });

    eventBus.emit('ai:proposalCreated', {
      proposalId: proposal.id,
      pageId,
      changeType: parsed.changeType,
      source: sourceRuleId ? 'health' : 'ai',
    });

    logActivity({
      userId: session.user.id,
      action: 'ai.proposal.created',
      entity: 'page',
      entityId: pageId,
      details: { changeType: parsed.changeType, source: sourceRuleId ? 'health' : 'ai' },
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error('Failed to create AI proposal:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI proposal' },
      { status: 500 },
    );
  }
}
