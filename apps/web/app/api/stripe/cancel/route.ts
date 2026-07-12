import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@fluid/database';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (!teamMember?.team.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const stripe = getStripe();

    await stripe.subscriptions.cancel(teamMember.team.stripeSubscriptionId);

    await prisma.team.update({
      where: { id: teamMember.teamId },
      data: {
        tier: 'free',
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
