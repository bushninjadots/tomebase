import { NextResponse } from 'next/server';
import { proposalService } from '@/lib/ai/proposals';
import { eventBus } from '@/lib/events';
import { logActivity } from '@/lib/activity';
import { withAuth, notFound, forbidden, conflict } from '@/lib/api-helpers';

export const POST = withAuth(async (session, _request, { params }) => {
  const { id } = await params;

  const proposal = await proposalService.getById(id);
  if (!proposal) return notFound('Proposal not found');

  if (proposal.userId !== session.user.id) return forbidden();

  if (proposal.status !== 'pending') {
    return conflict(`Proposal is already ${proposal.status}`);
  }

  await proposalService.reject(id);

  eventBus.emit('ai:proposalRejected', {
    proposalId: id,
    pageId: proposal.pageId,
  });

  logActivity({
    userId: session.user.id,
    action: 'ai.proposal.rejected',
    entity: 'page',
    entityId: proposal.pageId,
    details: { proposalId: id, changeType: proposal.changeType },
  });

  return NextResponse.json({ success: true });
});
