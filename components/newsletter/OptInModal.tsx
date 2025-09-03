'use client';

import { X, Mail, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { trackNewsletterEvent } from '@/lib/abtest';
import { useAnalytics } from '@/lib/analytics-client';

interface OptInModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'scroll' | 'time' | 'manual';
  title?: string;
  description?: string;
  incentive?: string;
  className?: string;
}

export default function OptInModal({
  isOpen,
  onClose,
  trigger = 'manual',
  title = 'Verpassen Sie keine KI-Innovation!',
  description = 'Erhalten Sie wöchentlich die neuesten Entwicklungen, Trends und praktische Tipps aus der Welt der Künstlichen Intelligenz.',
  incentive = '🎁 Bonus: Kostenloses KI-Tools Cheatsheet',
  className = '',
}: OptInModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const analytics = useAnalytics();

  useEffect(() => {
    if (isOpen) {
      // Track modal view
      if (typeof window !== 'undefined') {
        const sessionId =
          document.cookie
            .split('; ')
            .find((row) => row.startsWith('session_id='))
            ?.split('=')[1] || '';

        trackNewsletterEvent('view', sessionId, 'modal', {
          trigger,
          source: `modal_${trigger}`,
        });
      }
    }
  }, [isOpen, trigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Track newsletter signup attempt
      analytics.trackNewsletterSignup(`modal_${trigger}`);

      // Submit to newsletter API
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: `modal_${trigger}`,
          variant: 'modal',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail('');

        // Track successful signup
        if (typeof window !== 'undefined') {
          const sessionId =
            document.cookie
              .split('; ')
              .find((row) => row.startsWith('session_id='))
              ?.split('=')[1] || '';

          await trackNewsletterEvent('conversion', sessionId, 'modal', {
            trigger,
            source: `modal_${trigger}`,
          });
        }

        // Auto-close after success
        setTimeout(() => {
          onClose();
          setStatus('idle');
        }, 3000);
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

  const handleClose = () => {
    // Track modal close
    if (typeof window !== 'undefined') {
      const sessionId =
        document.cookie
          .split('; ')
          .find((row) => row.startsWith('session_id='))
          ?.split('=')[1] || '';

      trackNewsletterEvent('click', sessionId, 'modal', {
        action: 'close',
        trigger,
        source: `modal_${trigger}`,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 ${className}`}
        >
          {/* Close button */}
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {status === 'success' ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Erfolgreich angemeldet!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Danke für Ihr Interesse! Bitte überprüfen Sie Ihre E-Mails und bestätigen Sie Ihr
                Abonnement.
              </p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
                {incentive && (
                  <div className="flex items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {incentive}
                    </span>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="modal-email" className="sr-only">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    id="modal-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ihre@email.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={status === 'loading'}
                    required
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-cta="newsletter-signup-modal"
                  data-location={trigger}
                >
                  {status === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Wird angemeldet...
                    </>
                  ) : (
                    'Jetzt kostenlos anmelden'
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Durch die Anmeldung stimmen Sie unseren{' '}
                  <a
                    href="/datenschutz"
                    className="underline hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Datenschutzbestimmungen
                  </a>{' '}
                  zu. Kein Spam, Sie können sich jederzeit abmelden.
                </p>
              </form>

              {/* Social proof */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Bereits <strong>2,500+</strong> KI-Enthusiasten lesen unseren Newsletter
                </p>
                <div className="flex justify-center mt-2 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-xs text-gray-500">4.8/5</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
