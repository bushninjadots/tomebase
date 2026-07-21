import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@fluid/database';
import { enforceRateLimit } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const rl = enforceRateLimit(request, 'strict');
    if (rl) return rl;

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

    const appUrl = process.env.APP_URL || 'https://tomebase.vercel.app';

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
