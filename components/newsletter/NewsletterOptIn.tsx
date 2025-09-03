'use client';

import { useEffect, useState } from 'react';

import ExitIntent from './ExitIntent';
import OptInInline from './OptInInline';
import OptInModal from './OptInModal';

interface NewsletterOptInProps {
  placement?: 'content' | 'sidebar' | 'footer';
  showExitIntent?: boolean;
  className?: string;
}

export default function NewsletterOptIn({
  placement = 'content',
  showExitIntent = false,
  className,
}: NewsletterOptInProps) {
  const [variant, setVariant] = useState<'inline' | 'modal' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getABTestVariant() {
      try {
        // Get A/B test variant assignment
        const response = await fetch('/api/newsletter/abtest?testId=newsletter_optin_variant');
        const data = await response.json();

        if (data.success && data.data.variantId) {
          setVariant(data.data.variantId as 'inline' | 'modal');
        } else {
          // Fallback to inline if no A/B test assignment
          setVariant('inline');
        }
      } catch (error) {
        // console.error('Failed to get A/B test variant:', error);
        // Fallback to inline on error
        setVariant('inline');
      } finally {
        setLoading(false);
      }
    }

    getABTestVariant();
  }, []);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 h-32 ${className}`}>
        <div className="p-6">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const optInContent = (
    <>
      {variant === 'inline' && <OptInInline placement={placement} className={className} />}

      {variant === 'modal' && (
        <div
          className={`rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 ${className}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                🚀 FluxAO Newsletter
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Die neuesten KI-Trends & Insights wöchentlich
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              data-cta="newsletter-signup-trigger"
              data-location={placement}
            >
              Jetzt abonnieren
            </button>
          </div>

          <OptInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} trigger="manual" />
        </div>
      )}
    </>
  );

  // Wrap with exit intent if enabled
  if (showExitIntent) {
    return <ExitIntent enabled={true}>{optInContent}</ExitIntent>;
  }

  return optInContent;
}

// Hook to get newsletter opt-in variant for manual use
export function useNewsletterVariant() {
  const [variant, setVariant] = useState<'inline' | 'modal' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getVariant() {
      try {
        const response = await fetch('/api/newsletter/abtest?testId=newsletter_optin_variant');
        const data = await response.json();

        if (data.success && data.data.variantId) {
          setVariant(data.data.variantId as 'inline' | 'modal');
        } else {
          setVariant('inline'); // fallback
        }
      } catch (error) {
        // console.error('Failed to get newsletter variant:', error);
        setVariant('inline'); // fallback
      } finally {
        setLoading(false);
      }
    }

    getVariant();
  }, []);

  return { variant, loading };
}

// Pre-configured newsletter components for different placements
export function NewsletterHero({ className }: { className?: string }) {
  return <NewsletterOptIn placement="content" showExitIntent={true} className={className} />;
}

export function NewsletterSidebar({ className }: { className?: string }) {
  return <NewsletterOptIn placement="sidebar" showExitIntent={false} className={className} />;
}

export function NewsletterFooter({ className }: { className?: string }) {
  return <NewsletterOptIn placement="footer" showExitIntent={false} className={className} />;
}

// Newsletter CTA button with A/B testing
export function NewsletterCTA({
  text = 'Newsletter abonnieren',
  className = '',
  location = 'cta',
}: {
  text?: string;
  className?: string;
  location?: string;
}) {
  const { variant, loading } = useNewsletterVariant();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (variant === 'modal') {
      setIsModalOpen(true);
    } else {
      // Scroll to newsletter section or show inline form
      const newsletterSection = document.getElementById('newsletter-signup');
      if (newsletterSection) {
        newsletterSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded ${className}`} />
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${className}`}
        data-cta="newsletter-cta"
        data-location={location}
      >
        {text}
      </button>

      {variant === 'modal' && (
        <OptInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} trigger="manual" />
      )}
    </>
  );
}
