import { prisma } from './prisma';
import crypto from 'crypto';

export interface DSGVOCompliantData {
  subscriberId: string;
  email: string;
  consentData: {
    ipAddress?: string;
    userAgent?: string;
    consentTimestamp: Date;
    consentMethod: 'web_form' | 'api' | 'double_opt_in';
    consentVersion: string;
  };
  preferences: {
    frequency: 'weekly' | 'daily' | 'monthly';
    categories: string[];
    allowTracking: boolean;
    allowPersonalization: boolean;
  };
}

/**
 * DSGVO-compliant newsletter delivery system
 */
export class DSGVONewsletterDelivery {
  private readonly consentVersion = 'v2.0-2024';
  private readonly baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fluxao.com';

  /**
   * Generate unsubscribe token for DSGVO compliance
   */
  private generateUnsubscribeToken(subscriberId: string, email: string): string {
    const secret = process.env.NEWSLETTER_SECRET || 'default-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(`${subscriberId}:${email}:unsubscribe`)
      .digest('hex')
      .slice(0, 32);
  }

  /**
   * Generate tracking pixel URL with DSGVO compliance
   */
  private generateTrackingPixelUrl(campaignId: string, subscriberId: string): string {
    const token = crypto
      .createHmac('sha256', process.env.NEWSLETTER_SECRET || 'default-secret')
      .update(`${campaignId}:${subscriberId}:track`)
      .digest('hex')
      .slice(0, 16);

    return `${this.baseUrl}/api/newsletter/track/open?c=${campaignId}&s=${subscriberId}&t=${token}`;
  }

  /**
   * Generate click tracking URL with DSGVO compliance
   */
  private generateClickTrackingUrl(
    campaignId: string,
    subscriberId: string,
    originalUrl: string
  ): string {
    const token = crypto
      .createHmac('sha256', process.env.NEWSLETTER_SECRET || 'default-secret')
      .update(`${campaignId}:${subscriberId}:click:${originalUrl}`)
      .digest('hex')
      .slice(0, 16);

    const encodedUrl = encodeURIComponent(originalUrl);
    return `${this.baseUrl}/api/newsletter/track/click?c=${campaignId}&s=${subscriberId}&u=${encodedUrl}&t=${token}`;
  }

  /**
   * Process newsletter HTML for DSGVO compliance
   */
  async processNewsletterForDelivery(
    html: string,
    campaignId: string,
    subscriberId: string
  ): Promise<string> {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: subscriberId },
      include: {
        consents: {
          where: { consentType: 'MARKETING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    // Generate DSGVO-compliant URLs
    const unsubscribeToken = this.generateUnsubscribeToken(subscriberId, subscriber.email);
    const unsubscribeUrl = `${this.baseUrl}/newsletter/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(subscriber.email)}`;
    const preferencesUrl = `${this.baseUrl}/newsletter/preferences?token=${unsubscribeToken}&email=${encodeURIComponent(subscriber.email)}`;
    const trackingPixelUrl = this.generateTrackingPixelUrl(campaignId, subscriberId);

    // Replace template variables
    let processedHtml = html;
    processedHtml = processedHtml.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);
    processedHtml = processedHtml.replace(/\{\{PREFERENCES_URL\}\}/g, preferencesUrl);
    processedHtml = processedHtml.replace(/\{\{TRACKING_PIXEL_URL\}\}/g, trackingPixelUrl);

    // Add List-Unsubscribe header support
    processedHtml = processedHtml.replace(
      /\{\{LIST_UNSUBSCRIBE_HEADER\}\}/g,
      unsubscribeUrl
    );

    // Process links for click tracking (only if consent given)
    const hasTrackingConsent = subscriber.consents.some(
      consent => consent.consentType === 'TRACKING' && consent.consentGiven
    );

    if (hasTrackingConsent) {
      // Replace external links with tracking URLs
      processedHtml = processedHtml.replace(
        /href="(https?:\/\/[^"]+)"/g,
        (match, url) => {
          // Don't track internal links or unsubscribe links
          if (url.includes(this.baseUrl) || url.includes('unsubscribe') || url.includes('preferences')) {
            return match;
          }
          const trackingUrl = this.generateClickTrackingUrl(campaignId, subscriberId, url);
          return `href="${trackingUrl}"`;
        }
      );
    }

    return processedHtml;
  }

  /**
   * Log newsletter delivery for DSGVO compliance
   */
  async logNewsletterDelivery(
    campaignId: string,
    subscriberId: string,
    status: 'sent' | 'failed' | 'bounced'
  ): Promise<void> {
    try {
      await prisma.newsletterInteraction.create({
        data: {
          campaignId,
          subscriberId,
          type: 'DELIVERY',
          value: status,
          timestamp: new Date(),
          metadata: {
            deliveryStatus: status,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log newsletter delivery:', error);
    }
  }

  /**
   * Handle newsletter subscription with DSGVO compliance
   */
  async subscribeWithConsent(
    email: string,
    preferences: {
      frequency: 'weekly' | 'daily' | 'monthly';
      categories?: string[];
      allowTracking?: boolean;
      allowPersonalization?: boolean;
    },
    consentData: {
      ipAddress?: string;
      userAgent?: string;
      consentMethod: 'web_form' | 'api' | 'double_opt_in';
    }
  ): Promise<{ subscriberId: string; verificationRequired: boolean }> {
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    let subscriberId: string;
    let verificationRequired = false;

    if (existingSubscriber) {
      subscriberId = existingSubscriber.id;
      
      // Update preferences
      await prisma.newsletterSubscriber.update({
        where: { id: subscriberId },
        data: {
          frequency: preferences.frequency,
          categories: preferences.categories || [],
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new subscriber
      const subscriber = await prisma.newsletterSubscriber.create({
        data: {
          email,
          status: 'pending',
          frequency: preferences.frequency,
          categories: preferences.categories || [],
          preferences: {
            allowTracking: preferences.allowTracking ?? false,
            allowPersonalization: preferences.allowPersonalization ?? false,
          },
        },
      });

      subscriberId = subscriber.id;
      verificationRequired = true;
    }

    // Log consent for DSGVO compliance
    await this.logConsent(subscriberId, 'MARKETING', {
      consentGiven: true,
      consentMethod: consentData.consentMethod,
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent,
    });

    // Log tracking consent if specified
    if (preferences.allowTracking !== undefined) {
      await this.logConsent(subscriberId, 'TRACKING', {
        consentGiven: preferences.allowTracking,
        consentMethod: consentData.consentMethod,
        ipAddress: consentData.ipAddress,
        userAgent: consentData.userAgent,
      });
    }

    // Log personalization consent if specified
    if (preferences.allowPersonalization !== undefined) {
      await this.logConsent(subscriberId, 'PERSONALIZATION', {
        consentGiven: preferences.allowPersonalization,
        consentMethod: consentData.consentMethod,
        ipAddress: consentData.ipAddress,
        userAgent: consentData.userAgent,
      });
    }

    return { subscriberId, verificationRequired };
  }

  /**
   * Log consent for DSGVO compliance
   */
  private async logConsent(
    subscriberId: string,
    consentType: 'MARKETING' | 'TRACKING' | 'PERSONALIZATION' | 'DATA_PROCESSING',
    data: {
      consentGiven: boolean;
      consentMethod: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      // Hash IP address for privacy
      const hashedIp = data.ipAddress
        ? crypto.createHash('sha256').update(data.ipAddress).digest('hex').slice(0, 16)
        : null;

      await prisma.newsletterConsent.create({
        data: {
          subscriberId,
          consentType,
          consentGiven: data.consentGiven,
          consentMethod: data.consentMethod,
          ipAddress: hashedIp,
          userAgent: data.userAgent?.slice(0, 500), // Limit length
          consentVersion: this.consentVersion,
          metadata: {
            timestamp: new Date().toISOString(),
            version: this.consentVersion,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log consent:', error);
    }
  }

  /**
   * Handle unsubscribe request with DSGVO compliance
   */
  async handleUnsubscribe(
    email: string,
    token: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    if (!subscriber) {
      return { success: false, message: 'Subscriber not found' };
    }

    // Verify token
    const expectedToken = this.generateUnsubscribeToken(subscriber.id, email);
    if (token !== expectedToken) {
      return { success: false, message: 'Invalid unsubscribe token' };
    }

    // Update subscriber status
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
        unsubscribeReason: reason,
      },
    });

    // Log consent withdrawal
    await this.logConsent(subscriber.id, 'MARKETING', {
      consentGiven: false,
      consentMethod: 'unsubscribe_link',
    });

    // Log unsubscribe interaction
    await prisma.newsletterInteraction.create({
      data: {
        subscriberId: subscriber.id,
        type: 'UNSUBSCRIBE',
        timestamp: new Date(),
        metadata: {
          reason,
          method: 'unsubscribe_link',
        },
      },
    });

    return { success: true, message: 'Successfully unsubscribed' };
  }

  /**
   * Get DSGVO data for a subscriber
   */
  async getSubscriberData(email: string): Promise<{
    personalData: any;
    consents: any[];
    interactions: any[];
    campaigns: any[];
  }> {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      include: {
        consents: true,
        interactions: true,
        recipients: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                subject: true,
                sentAt: true,
              },
            },
          },
        },
      },
    });

    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    // Remove sensitive data and format for DSGVO export
    const personalData = {
      email: subscriber.email,
      subscribed_at: subscriber.createdAt,
      status: subscriber.status,
      preferences: subscriber.preferences,
      frequency: subscriber.frequency,
      categories: subscriber.categories,
      unsubscribed_at: subscriber.unsubscribedAt,
      unsubscribe_reason: subscriber.unsubscribeReason,
    };

    const consents = subscriber.consents.map(consent => ({
      type: consent.consentType,
      given: consent.consentGiven,
      timestamp: consent.createdAt,
      method: consent.consentMethod,
      version: consent.consentVersion,
    }));

    const interactions = subscriber.interactions.map(interaction => ({
      type: interaction.type,
      timestamp: interaction.timestamp,
      campaign_id: interaction.campaignId,
      metadata: interaction.metadata,
    }));

    const campaigns = subscriber.recipients.map(recipient => ({
      campaign_name: recipient.campaign.name,
      subject: recipient.campaign.subject,
      sent_at: recipient.sentAt,
      status: recipient.status,
      opened_at: recipient.openedAt,
      clicked_at: recipient.clickedAt,
    }));

    return {
      personalData,
      consents,
      interactions,
      campaigns,
    };
  }

  /**
   * Delete all subscriber data (DSGVO right to erasure)
   */
  async deleteSubscriberData(email: string, token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    if (!subscriber) {
      return { success: false, message: 'Subscriber not found' };
    }

    // Verify token
    const expectedToken = this.generateUnsubscribeToken(subscriber.id, email);
    if (token !== expectedToken) {
      return { success: false, message: 'Invalid deletion token' };
    }

    // Delete all related data in transaction
    await prisma.$transaction(async (tx) => {
      await tx.newsletterInteraction.deleteMany({
        where: { subscriberId: subscriber.id }
      });

      await tx.newsletterRecipient.deleteMany({
        where: { subscriberId: subscriber.id }
      });

      await tx.newsletterConsent.deleteMany({
        where: { subscriberId: subscriber.id }
      });

      await tx.newsletterListSubscriber.deleteMany({
        where: { subscriberId: subscriber.id }
      });

      await tx.newsletterSubscriber.delete({
        where: { id: subscriber.id }
      });
    });

    return { success: true, message: 'All data successfully deleted' };
  }

  /**
   * Generate DSGVO-compliant email headers
   */
  generateEmailHeaders(
    campaignId: string,
    subscriberId: string,
    subject: string
  ): Record<string, string> {
    const unsubscribeToken = this.generateUnsubscribeToken(subscriberId, 'placeholder');
    const unsubscribeUrl = `${this.baseUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`;

    return {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'List-ID': `FluxAO Newsletter <newsletter.${new URL(this.baseUrl).hostname}>`,
      'Precedence': 'bulk',
      'X-Auto-Response-Suppress': 'All',
      'X-Campaign-ID': campaignId,
    };
  }
}

// Export singleton instance
export const dsgvoNewsletterDelivery = new DSGVONewsletterDelivery();