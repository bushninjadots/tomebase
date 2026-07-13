import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe, STRIPE_PRO_PRICE_ID } from '@/lib/stripe';
import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    const stripePriceId = priceId === 'pro' ? STRIPE_PRO_PRICE_ID : null;
    if (!stripePriceId) {
      return NextResponse.json({ error: 'Invalid price tier' }, { status: 400 });
    }

    const team = await getOrCreatePersonalTeam(session.user.id);

    let customerId = team.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: { userId: session.user.id, teamId: team.id },
      });
      customerId = customer.id;

      await prisma.team.update({
        where: { id: team.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.APP_URL || 'https://tomebase.io';

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId: session.user.id, teamId: team.id },
      subscription_data: {
        metadata: { userId: session.user.id, teamId: team.id },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
