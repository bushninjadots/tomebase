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

    const subscription = await stripe.subscriptions.retrieve(teamMember.team.stripeSubscriptionId);

    if (subscription.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is already scheduled for cancellation' }, { status: 400 });
    }

    await stripe.subscriptions.update(teamMember.team.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEnd = subscription.items.data[0]?.current_period_end;

    await prisma.team.update({
      where: { id: teamMember.teamId },
      data: {
        stripeCancelAtPeriodEnd: true,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });

    return NextResponse.json({
      success: true,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
