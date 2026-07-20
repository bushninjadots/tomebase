import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proposalService } from '@/lib/ai/proposals';
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

    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: `Proposal is already ${proposal.status}` },
        { status: 409 },
      );
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
  } catch (error) {
    console.error('Failed to reject proposal:', error);
    return NextResponse.json(
      { error: 'Failed to reject proposal' },
      { status: 500 },
    );
  }
}
