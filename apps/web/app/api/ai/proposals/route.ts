import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proposalService, type ProposalStatus } from '@/lib/ai/proposals';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const status = searchParams.get('status') as ProposalStatus | null;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const proposals = await proposalService.getByPageId(
      pageId,
      status && ['pending', 'accepted', 'rejected'].includes(status) ? status : undefined,
    );

    const stats = await proposalService.getStats(pageId);

    return NextResponse.json({ proposals, stats });
  } catch (error) {
    console.error('Failed to list proposals:', error);
    return NextResponse.json(
      { error: 'Failed to list proposals' },
      { status: 500 },
    );
  }
}
