import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '@/lib/prisma';

// Only initialize Stripe if we have the necessary keys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

export async function POST(request: NextRequest) {
  // Check if Stripe is properly configured
  if (!stripe || !webhookSecret) {
    // console.warn('Stripe webhook called but Stripe is not configured');
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      // console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Fulfill the purchase
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        // console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return;

  const userId = session.metadata?.userId;
  if (!userId) {
    // console.error('No userId in session metadata');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Update user with subscription info
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      role: 'PREMIUM',
    },
  });

  // Log the subscription
  await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: subscription.status as any,
    },
  });

  // console.log(`Subscription created for user ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      role: subscription.status === 'active' ? 'PREMIUM' : 'USER',
    },
  });

  // Update subscription record
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: subscription.status as any,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      role: 'USER',
    },
  });

  // Update subscription record
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // console.log(`Subscription canceled for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  // Log successful payment
  // console.log(`Payment succeeded for user ${userId}`);

  // You can send a receipt email here
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  // Log failed payment
  // console.log(`Payment failed for user ${userId}`);

  // Send payment failed email
  // You can implement retry logic or notifications here
}
