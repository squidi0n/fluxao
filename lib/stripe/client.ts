import { stripe } from './config';

import type { User } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { auditLogger, AuditAction } from '@/lib/security/audit-log';

export class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async createCustomer(user: User) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      // Update user with Stripe customer ID
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { stripeCustomerId: customer.id },
        create: {
          userId: user.id,
          stripeCustomerId: customer.id,
          status: 'INACTIVE',
          plan: 'FREE',
        },
      });

      await auditLogger.logSuccess(AuditAction.USER_UPDATED, {
        userId: user.id,
        targetId: user.id,
        targetType: 'User',
        metadata: { stripeCustomerId: customer.id },
      });

      return customer;
    } catch (error) {
      await auditLogger.logFailure(AuditAction.SYSTEM_ERROR, 'Failed to create Stripe customer', {
        userId: user.id,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }
  }

  async createCheckoutSession(user: User, priceId: string, successUrl: string, cancelUrl: string) {
    try {
      // Get or create Stripe customer
      let customerId = await this.getCustomerId(user);
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      await auditLogger.logSuccess(AuditAction.SUBSCRIPTION_UPDATED, {
        userId: user.id,
        targetId: session.id,
        targetType: 'CheckoutSession',
        metadata: { priceId, sessionUrl: session.url },
      });

      return session;
    } catch (error) {
      await auditLogger.logFailure(AuditAction.SYSTEM_ERROR, 'Failed to create checkout session', {
        userId: user.id,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }
  }

  async createPortalSession(user: User, returnUrl: string) {
    try {
      const customerId = await this.getCustomerId(user);
      if (!customerId) {
        throw new Error('No Stripe customer found for user');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      await auditLogger.logFailure(AuditAction.SYSTEM_ERROR, 'Failed to create portal session', {
        userId: user.id,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }
  }

  async cancelSubscription(user: User) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      );

      await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          cancelAtPeriodEnd: true,
          cancelledAt: new Date(),
        },
      });

      await auditLogger.logSuccess(AuditAction.SUBSCRIPTION_CANCELLED, {
        userId: user.id,
        targetId: subscription.stripeSubscriptionId,
        targetType: 'Subscription',
      });

      return stripeSubscription;
    } catch (error) {
      await auditLogger.logFailure(AuditAction.SYSTEM_ERROR, 'Failed to cancel subscription', {
        userId: user.id,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }
  }

  async resumeSubscription(user: User) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      });

      await auditLogger.logSuccess(AuditAction.SUBSCRIPTION_UPDATED, {
        userId: user.id,
        targetId: subscription.stripeSubscriptionId,
        targetType: 'Subscription',
        metadata: { action: 'resumed' },
      });

      return stripeSubscription;
    } catch (error) {
      await auditLogger.logFailure(AuditAction.SYSTEM_ERROR, 'Failed to resume subscription', {
        userId: user.id,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }
  }

  private async getCustomerId(user: User): Promise<string | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    return subscription?.stripeCustomerId || null;
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
    }
  }

  private async handleCheckoutSessionCompleted(session: any) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    await prisma.subscription.update({
      where: { userId },
      data: {
        stripeSubscriptionId: session.subscription,
        status: 'ACTIVE',
      },
    });
  }

  private async handleSubscriptionUpdate(subscription: any) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const planFromPrice = this.getPlanFromPriceId(subscription.items.data[0].price.id);

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: this.mapStripeStatus(subscription.status),
        plan: planFromPrice,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        stripePriceId: subscription.items.data[0].price.id,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: any) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  private async handleInvoicePaymentSucceeded(invoice: any) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    await prisma.invoice.create({
      data: {
        stripeInvoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'PAID',
        paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: any) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    await prisma.invoice.create({
      data: {
        stripeInvoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'FAILED',
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      },
    });
  }

  private mapStripeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      unpaid: 'UNPAID',
      canceled: 'CANCELLED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'EXPIRED',
      trialing: 'TRIALING',
      paused: 'PAUSED',
    };
    return statusMap[status] || 'INACTIVE';
  }

  private getPlanFromPriceId(priceId: string): string {
    // Map price IDs to plan names
    const priceToPlans: Record<string, string> = {
      [process.env.STRIPE_PRICE_BASIC_MONTHLY || '']: 'BASIC',
      [process.env.STRIPE_PRICE_BASIC_YEARLY || '']: 'BASIC',
      [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: 'PRO',
      [process.env.STRIPE_PRICE_PRO_YEARLY || '']: 'PRO',
      [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '']: 'ENTERPRISE',
      [process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '']: 'ENTERPRISE',
    };
    return priceToPlans[priceId] || 'FREE';
  }
}

export const stripeService = StripeService.getInstance();
