import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (body.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (teamMember?.team.stripeSubscriptionId) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(teamMember.team.stripeSubscriptionId);
      } catch {
        // Best-effort cleanup
      }
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    for (const project of projects) {
      await prisma.apiKey.deleteMany({ where: { projectId: project.id } });
      await prisma.webhook.deleteMany({ where: { projectId: project.id } });
      await prisma.healthReport.deleteMany({ where: { projectId: project.id } });
      await prisma.chatMessage.deleteMany({ where: { projectId: project.id } });
      await prisma.docPage.deleteMany({ where: { projectId: project.id } });
    }

    await prisma.project.deleteMany({ where: { userId: session.user.id } });

    await prisma.teamMember.deleteMany({ where: { userId: session.user.id } });
    await prisma.bookmark.deleteMany({ where: { userId: session.user.id } });
    await prisma.comment.deleteMany({ where: { userId: session.user.id } });

    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    await prisma.account.deleteMany({ where: { userId: session.user.id } });

    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
