'use client';

import { ANALYTICS_EVENTS } from './analytics';

export interface ClientAnalyticsEvent {
  type: string;
  path?: string;
  properties?: Record<string, any>;
  referrer?: string;
}

class AnalyticsClient {
  private hasConsent: boolean | null = null;
  private sessionId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeConsent();
    }
  }

  private initializeConsent() {
    // Check consent cookie
    const consentCookie = this.getCookie('consent_prefs');
    if (consentCookie) {
      try {
        const consent = JSON.parse(consentCookie);
        this.hasConsent = consent.analytics;
      } catch {
        this.hasConsent = null;
      }
    }

    // Get session ID
    this.sessionId = this.getCookie('session_id');
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  async checkConsent(): Promise<boolean> {
    if (this.hasConsent !== null) {
      return this.hasConsent;
    }

    try {
      const response = await fetch('/api/analytics/consent');
      const data = await response.json();

      this.hasConsent = data.hasConsent && data.consent?.analytics;
      this.sessionId = data.sessionId;

      return this.hasConsent;
    } catch (error) {
      // console.error('Failed to check analytics consent:', error);
      return false;
    }
  }

  async track(event: ClientAnalyticsEvent): Promise<void> {
    // Always allow pageviews for essential functionality
    if (event.type !== ANALYTICS_EVENTS.PAGEVIEW) {
      const hasConsent = await this.checkConsent();
      if (!hasConsent) {
        return;
      }
    }

    try {
      await fetch('/api/analytics/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          referrer: event.referrer || document.referrer || undefined,
        }),
      });
    } catch (error) {
      // console.error('Failed to track analytics event:', error);
    }
  }

  // Convenience methods for common events
  async trackPageview(path?: string) {
    await this.track({
      type: ANALYTICS_EVENTS.PAGEVIEW,
      path: path || window.location.pathname,
    });
  }

  async trackOutboundClick(url: string) {
    await this.track({
      type: ANALYTICS_EVENTS.OUTBOUND_CLICK,
      properties: { url },
    });
  }

  async trackCTAClick(ctaName: string, location?: string) {
    await this.track({
      type: ANALYTICS_EVENTS.CTA_CLICK,
      properties: { ctaName, location },
    });
  }

  async trackSearch(query: string, results?: number) {
    await this.track({
      type: ANALYTICS_EVENTS.SEARCH,
      properties: { query, results },
    });
  }

  async trackNewsletterSignup(source?: string) {
    await this.track({
      type: ANALYTICS_EVENTS.NEWSLETTER_SIGNUP,
      properties: { source },
    });
  }

  async trackShareArticle(method: string, articleSlug: string) {
    await this.track({
      type: ANALYTICS_EVENTS.SHARE_ARTICLE,
      properties: { method, articleSlug },
    });
  }

  async trackDownload(filename: string, type?: string) {
    await this.track({
      type: ANALYTICS_EVENTS.DOWNLOAD,
      properties: { filename, type },
    });
  }

  async trackContactForm(formType: string) {
    await this.track({
      type: ANALYTICS_EVENTS.CONTACT_FORM,
      properties: { formType },
    });
  }
}

// Singleton instance
export const analytics = new AnalyticsClient();

// Hook for React components
export function useAnalytics() {
  return analytics;
}
