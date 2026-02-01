import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { updateUserPlan, addCredits } from '@/lib/db';
import { CREDIT_PACKS, type CreditPackId } from '@/lib/plans';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const raw = await request.text();
  const h = await headers();
  const sig = h.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (e) {
    console.error('Webhook signature verification failed:', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = (session.metadata?.user_id ?? session.metadata?.supabase_user_id) as string;
      const mode = session.metadata?.mode as string;
      if (!userId) break;

      if (mode === 'subscription_pro' || mode === 'subscription_startup') {
        const subId = session.subscription as string;
        const plan = mode === 'subscription_pro' ? 'pro' : 'startup';
        await updateUserPlan(userId, plan, subId);
      } else if (mode?.startsWith('credits_')) {
        const pack = mode.replace('credits_', '') as CreditPackId;
        const { scraps } = CREDIT_PACKS[pack];
        await addCredits(userId, pack, scraps);
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = (sub.metadata?.user_id ?? sub.metadata?.supabase_user_id) as string | undefined;
      if (!userId) break;

      if (event.type === 'customer.subscription.deleted') {
        await updateUserPlan(userId, 'free', null);
      } else {
        const priceId = sub.items.data[0]?.price.id;
        const proPrice = process.env.STRIPE_PRICE_PRO_MONTHLY;
        const startupPrice = process.env.STRIPE_PRICE_STARTUP_MONTHLY;
        const plan = priceId === startupPrice ? 'startup' : priceId === proPrice ? 'pro' : 'free';
        await updateUserPlan(userId, plan, sub.id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
