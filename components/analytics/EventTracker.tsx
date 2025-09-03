'use client';

import { useEffect, useRef } from 'react';

import { useAnalytics } from '@/lib/analytics-client';

interface EventTrackerProps {
  children: React.ReactNode;
}

export function EventTracker({ children }: EventTrackerProps) {
  const analytics = useAnalytics();
  const hasTrackedPageview = useRef(false);

  useEffect(() => {
    // Track pageview on mount (avoid double tracking)
    if (!hasTrackedPageview.current) {
      analytics.trackPageview();
      hasTrackedPageview.current = true;
    }
  }, [analytics]);

  useEffect(() => {
    // Track outbound clicks
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (!link) return;

      const href = link.href;
      if (!href) return;

      // Check if it's an outbound link
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        analytics.trackOutboundClick(href);
      }

      // Check if it's a CTA link
      const ctaName = link.dataset.cta || link.dataset.event;
      if (ctaName) {
        const location = link.dataset.location || window.location.pathname;
        analytics.trackCTAClick(ctaName, location);
      }
    };

    // Track form submissions
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      const formType = form.dataset.analytics || form.name || 'unknown';

      // Track specific form types
      if (formType.includes('newsletter')) {
        const source = form.dataset.source || window.location.pathname;
        analytics.trackNewsletterSignup(source);
      } else if (formType.includes('contact')) {
        analytics.trackContactForm(formType);
      }
    };

    // Track downloads
    const handleDownload = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (!link || !link.href) return;

      // Check for download links (file extensions)
      const downloadExtensions = [
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        '.zip',
        '.rar',
        '.mp3',
        '.mp4',
        '.avi',
      ];
      const isDownload = downloadExtensions.some((ext) => link.href.toLowerCase().includes(ext));

      if (isDownload || link.download) {
        const filename = link.download || link.href.split('/').pop() || 'unknown';
        const type = filename.split('.').pop() || 'unknown';
        analytics.trackDownload(filename, type);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('click', handleDownload);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('click', handleDownload);
      document.removeEventListener('submit', handleSubmit);
    };
  }, [analytics]);

  // Track search events
  useEffect(() => {
    const handleSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLInputElement;

      // Look for search inputs
      if (
        target.type === 'search' ||
        target.name?.includes('search') ||
        target.placeholder?.toLowerCase().includes('search')
      ) {
        // Track on Enter key
        if (event.key === 'Enter' && target.value.trim()) {
          analytics.trackSearch(target.value.trim());
        }
      }
    };

    document.addEventListener('keydown', handleSearch);

    return () => {
      document.removeEventListener('keydown', handleSearch);
    };
  }, [analytics]);

  return <>{children}</>;
}

// Hook for manual event tracking in components
export function useEventTracker() {
  const analytics = useAnalytics();

  return {
    trackCTA: (ctaName: string, location?: string) => analytics.trackCTAClick(ctaName, location),
    trackShare: (method: string, articleSlug: string) =>
      analytics.trackShareArticle(method, articleSlug),
    trackSearch: (query: string, results?: number) => analytics.trackSearch(query, results),
    trackNewsletter: (source?: string) => analytics.trackNewsletterSignup(source),
    trackContact: (formType: string) => analytics.trackContactForm(formType),
    trackDownload: (filename: string, type?: string) => analytics.trackDownload(filename, type),
    trackOutbound: (url: string) => analytics.trackOutboundClick(url),
  };
}
