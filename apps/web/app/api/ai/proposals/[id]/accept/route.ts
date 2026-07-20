import { NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { auth } from '@/lib/auth';
import { proposalService, validateStoredProposal } from '@/lib/ai/proposals';
import { eventBus } from '@/lib/events';
import { logActivity } from '@/lib/activity';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const proposal = await proposalService.getById(id);
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validation = validateStoredProposal(proposal as unknown as Record<string, unknown>);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: `Proposal is already ${proposal.status}` },
        { status: 409 },
      );
    }

    const page = await prisma.docPage.findUnique({ where: { id: proposal.pageId } });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    let newContent = page.content;

    if (proposal.changeType === 'replace') {
      if (!page.content.includes(proposal.originalContent)) {
        return NextResponse.json(
          { error: 'Original content no longer exists in document' },
          { status: 409 },
        );
      }
      newContent = page.content.replace(proposal.originalContent, proposal.proposedContent);
    } else if (proposal.changeType === 'insert') {
      newContent = page.content + '\n\n' + proposal.proposedContent;
    } else if (proposal.changeType === 'delete') {
      if (!page.content.includes(proposal.originalContent)) {
        return NextResponse.json(
          { error: 'Content to delete no longer exists in document' },
          { status: 409 },
        );
      }
      newContent = page.content.replace(proposal.originalContent, '');
    }

    await prisma.pageSnapshot.create({
      data: {
        pageId: proposal.pageId,
        title: page.title,
        content: page.content,
        reason: 'pre-ai-apply',
      },
    });

    await prisma.docPage.update({
      where: { id: proposal.pageId },
      data: { content: newContent },
    });

    await proposalService.accept(id);

    eventBus.emit('ai:proposalAccepted', {
      proposalId: id,
      pageId: proposal.pageId,
      content: newContent,
    });

    eventBus.emit('document:saved', {
      pageId: proposal.pageId,
      content: newContent,
      snapshotId: '',
    });

    logActivity({
      userId: session.user.id,
      action: 'ai.proposal.accepted',
      entity: 'page',
      entityId: proposal.pageId,
      details: { proposalId: id, changeType: proposal.changeType },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        content: newContent,
      },
    });
  } catch (error) {
    console.error('Failed to accept proposal:', error);
    return NextResponse.json(
      { error: 'Failed to accept proposal' },
      { status: 500 },
    );
  }
}
