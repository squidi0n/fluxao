import Stripe from 'stripe';

// Only initialize Stripe if we have a valid key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  : null;

export const STRIPE_PRICES = {
  PRO: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
};

export const PLANS = {
  FREE: {
    name: 'Kostenlos',
    priceId: null,
    price: 0,
    priceYearly: 0,
    features: [
      'Alle Artikel lesen',
      'Kommentare schreiben',
      'Basis-Profil anpassen',
      'Newsletter erhalten',
    ],
    limits: {
      maxPosts: 0,
      maxAnalytics: false,
      premiumContent: false,
      customDomain: false,
      prioritySupport: false,
    },
  },
  PRO: {
    name: 'Premium',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    price: 4.99,
    priceYearly: 49.99,
    features: [
      'Alles aus Kostenlos',
      'Zugang zu Premium-Inhalten',
      'Erweiterte Analytics',
      'Werbefreie Erfahrung',
      'Früher Zugang zu neuen Features',
      'Inhalte offline herunterladen',
      'Prioritäts-E-Mail-Support',
    ],
    limits: {
      maxPosts: 10,
      maxAnalytics: true,
      premiumContent: true,
      customDomain: false,
      prioritySupport: true,
    },
  },
};

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
    },
  });
}

export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function getInvoices(customerId: string, limit = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}
