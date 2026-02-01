import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getUser, updateUserStripeCustomer } from '@/lib/db';
import { stripe, STRIPE_PRICES, type CheckoutMode } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Paiement non configuré' }, { status: 503 });
  }
  try {
    const user = await getSessionFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const body = await request.json();
    const mode = body.mode as CheckoutMode;
    const successUrl = (body.successUrl as string) || `${APP_URL}/?checkout=success`;
    const cancelUrl = (body.cancelUrl as string) || `${APP_URL}/#pricing`;

    const dbUser = await getUser(user.id);
    let customerId = dbUser?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await updateUserStripeCustomer(user.id, customerId);
    }

    const isSubscription = mode === 'subscription_pro' || mode === 'subscription_startup';
    const priceId =
      mode === 'subscription_pro' ? STRIPE_PRICES.pro_monthly :
      mode === 'subscription_startup' ? STRIPE_PRICES.startup_monthly :
      mode === 'credits_small' ? STRIPE_PRICES.credit_small :
      mode === 'credits_medium' ? STRIPE_PRICES.credit_medium :
      mode === 'credits_large' ? STRIPE_PRICES.credit_large :
      mode === 'credits_xl' ? STRIPE_PRICES.credit_xl : null;

    if (!priceId) {
      return NextResponse.json({ error: 'Mode invalide' }, { status: 400 });
    }

    const sessionParams: import('stripe').Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id, mode },
      ...(isSubscription
        ? {
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            subscription_data: { metadata: { user_id: user.id } },
          }
        : {
            mode: 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
          }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('Stripe checkout error:', e);
    return NextResponse.json({ error: 'Erreur checkout' }, { status: 500 });
  }
}
