'use client';

import { Mail, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { trackNewsletterEvent } from '@/lib/abtest';
import { useAnalytics } from '@/lib/analytics-client';

interface OptInInlineProps {
  variant?: 'default' | 'minimal' | 'colorful';
  placement?: 'content' | 'sidebar' | 'footer';
  showDescription?: boolean;
  ctaText?: string;
  className?: string;
}

export default function OptInInline({
  variant = 'default',
  placement = 'content',
  showDescription = true,
  ctaText = 'Kostenlos abonnieren',
  className = '',
}: OptInInlineProps) {
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const analytics = useAnalytics();

  // Safe analytics tracking for form view
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'newsletter_form_view', {
        variant: 'inline',
        placement: placement
      });
    }
  }, [placement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    if (!privacyAccepted) {
      setErrorMessage('Bitte stimmen Sie den Datenschutzbestimmungen zu');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Track newsletter signup attempt
      analytics.trackNewsletterSignup(`inline_${placement}`);

      // Submit to newsletter API
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          privacyAccepted,
          source: `inline_${placement}`,
          variant: 'inline',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setPrivacyAccepted(false);

        // Track successful signup
        if (typeof window !== 'undefined') {
          const sessionId =
            document.cookie
              .split('; ')
              .find((row) => row.startsWith('session_id='))
              ?.split('=')[1] || '';

          await trackNewsletterEvent('conversion', sessionId, 'inline', {
            placement,
            source: `inline_${placement}`,
          });
        }
      } else {
        throw new Error(data.detail || 'Newsletter-Anmeldung fehlgeschlagen');
      }
    } catch (error) {
      // console.error('Newsletter signup error:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      );
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700';
      case 'colorful':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700';
      default:
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm';
    }
  };

  const getPlacementClasses = () => {
    switch (placement) {
      case 'sidebar':
        return 'max-w-sm';
      case 'footer':
        return 'max-w-md mx-auto text-center';
      default:
        return 'max-w-2xl';
    }
  };

  if (status === 'success') {
    return (
      <div
        className={`rounded-lg p-6 ${getVariantClasses()} ${getPlacementClasses()} ${className}`}
      >
        <div className="flex items-center justify-center text-green-600 dark:text-green-400 mb-3">
          <Check className="h-6 w-6 mr-2" />
          <h3 className="text-lg font-semibold">Erfolgreich angemeldet!</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Danke für Ihr Interesse! Bitte überprüfen Sie Ihre E-Mails und bestätigen Sie Ihr
          Abonnement.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-6 ${getVariantClasses()} ${getPlacementClasses()} ${className}`}>
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full mr-3">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">FluxAO Newsletter</h3>
          {showDescription && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {placement === 'footer'
                ? 'Die neuesten KI-Trends direkt in Ihr Postfach'
                : 'Bleiben Sie auf dem Laufenden mit den neuesten Entwicklungen in der KI-Welt'}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={placement === 'footer' ? 'flex flex-col sm:flex-row gap-3' : 'space-y-3'}>
          <div className={placement === 'footer' ? 'flex-1' : ''}>
            <label htmlFor={`email-${placement}`} className="sr-only">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              id={`email-${placement}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@email.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={status === 'loading'}
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading' || !privacyAccepted}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-cta="newsletter-signup-inline"
            data-location={placement}
          >
            {status === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Anmelden...
              </>
            ) : (
              <>
                {ctaText}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            {errorMessage}
          </div>
        )}

        {/* Privacy Checkbox */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id={`privacy-${placement}`}
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={status === 'loading' || status === 'success'}
          />
          <label htmlFor={`privacy-${placement}`} className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            Ich stimme den{' '}
            <a href="/datenschutz" className="underline hover:text-gray-700 dark:hover:text-gray-300">
              Datenschutzbestimmungen
            </a>{' '}
            zu und möchte den Newsletter erhalten. *
          </label>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Sie können sich jederzeit abmelden.
        </p>
      </form>

    </div>
  );
}
