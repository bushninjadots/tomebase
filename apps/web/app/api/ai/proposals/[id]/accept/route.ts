import { NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { proposalService, validateStoredProposal } from '@/lib/ai/proposals';
import { eventBus } from '@/lib/events';
import { logActivity } from '@/lib/activity';
import { withAuth, notFound, forbidden, conflict } from '@/lib/api-helpers';

export const POST = withAuth(async (session, _request, { params }) => {
  const { id } = await params;

  const proposal = await proposalService.getById(id);
  if (!proposal) return notFound('Proposal not found');

  if (proposal.userId !== session.user.id) return forbidden();

  const validation = validateStoredProposal(proposal as unknown as Record<string, unknown>);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  if (proposal.status !== 'pending') {
    return conflict(`Proposal is already ${proposal.status}`);
  }

  const page = await prisma.docPage.findUnique({ where: { id: proposal.pageId } });
  if (!page) return notFound('Page not found');

  let newContent = page.content;

  if (proposal.changeType === 'replace') {
    if (!page.content.includes(proposal.originalContent)) {
      return conflict('Original content no longer exists in document');
    }
    newContent = page.content.replace(proposal.originalContent, proposal.proposedContent);
  } else if (proposal.changeType === 'insert') {
    newContent = page.content + '\n\n' + proposal.proposedContent;
  } else if (proposal.changeType === 'delete') {
    if (!page.content.includes(proposal.originalContent)) {
      return conflict('Content to delete no longer exists in document');
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
});
