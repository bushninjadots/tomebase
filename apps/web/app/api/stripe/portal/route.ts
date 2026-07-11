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

    if (!teamMember?.team.stripeCustomerId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: teamMember.team.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
