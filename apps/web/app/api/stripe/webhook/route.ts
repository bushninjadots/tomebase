import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@fluid/database';
import Stripe from 'stripe';

function getTierFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'free';
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const teamId = session.metadata?.teamId;
        const subscriptionId = session.subscription as string;

        if (!teamId || !subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id || '';
        const tier = getTierFromPriceId(priceId);

        const periodEnd = subscription.items.data[0]?.current_period_end;

        await prisma.team.update({
          where: { id: teamId },
          data: {
            tier,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const teamId = subscription.metadata?.teamId;

        let team;
        if (teamId) {
          team = await prisma.team.findUnique({ where: { id: teamId } });
        } else {
          team = await prisma.team.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });
        }

        if (!team) break;

        const priceId = subscription.items.data[0]?.price.id || '';
        const tier = getTierFromPriceId(priceId);
        const periodEnd = subscription.items.data[0]?.current_period_end;

        await prisma.team.update({
          where: { id: team.id },
          data: {
            tier,
            stripePriceId: priceId,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const teamId = subscription.metadata?.teamId;

        let team;
        if (teamId) {
          team = await prisma.team.findUnique({ where: { id: teamId } });
        } else {
          team = await prisma.team.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });
        }

        if (team) {
          await prisma.team.update({
            where: { id: team.id },
            data: {
              tier: 'free',
              stripeSubscriptionId: null,
              stripePriceId: null,
              currentPeriodEnd: null,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionDetails = invoice.parent?.subscription_details;
        const subscriptionId = typeof subscriptionDetails?.subscription === 'string'
          ? subscriptionDetails.subscription
          : subscriptionDetails?.subscription?.id;

        if (subscriptionId) {
          const team = await prisma.team.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });
          if (team) {
            console.error(`Payment failed for team ${team.id} (${team.name})`);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
