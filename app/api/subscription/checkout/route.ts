import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Only initialize Stripe if we have a valid key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json({ error: 'Payment system is not configured' }, { status: 503 });
  }
  try {
    const user = await getUserFromCookies();

    if (!user?.email) {
      return NextResponse.json({ error: 'You must be logged in to subscribe' }, { status: 401 });
    }

    const { priceId, plan } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customer;
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, stripeCustomerId: true, email: true, name: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.stripeCustomerId) {
      customer = await stripe.customers.retrieve(dbUser.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: dbUser.email!,
        name: dbUser.name || undefined,
        metadata: {
          userId: dbUser.id,
        },
      });

      // Save Stripe customer ID
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: plan === 'pro' ? 7 : undefined,
        metadata: {
          userId: dbUser.id,
          plan: plan || 'pro',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=true`,
      metadata: {
        userId: dbUser.id,
        plan: plan || 'pro',
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    // console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}

// Get subscription status
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies();

    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    if (!dbUser || !dbUser.stripeCustomerId) {
      return NextResponse.json({
        subscribed: false,
        plan: 'free',
      });
    }

    if (dbUser.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId);

      return NextResponse.json({
        subscribed: subscription.status === 'active' || subscription.status === 'trialing',
        plan: subscription.metadata.plan || 'pro',
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      });
    }

    return NextResponse.json({
      subscribed: false,
      plan: 'free',
    });
  } catch (error) {
    // console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to get subscription status' }, { status: 500 });
  }
}
