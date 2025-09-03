'use client';

import { useState } from 'react';

interface NewsletterSignupProps {
  variant?: 'default' | 'light' | 'compact';
}

export default function NewsletterSignup({ variant = 'default' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privacyAccepted) {
      setStatus('error');
      setMessage('Bitte stimme den Datenschutzbestimmungen zu.');
      return;
    }
    
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, privacyAccepted }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Vielen Dank! Bitte bestätige deine Anmeldung über den Link in der E-Mail.');
        setEmail('');
        setPrivacyAccepted(false);
      } else {
        setStatus('error');
        setMessage(data.error || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    }
  };

  // Compact variant for sidebar
  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Deine E-Mail"
          required
          disabled={status === 'loading' || status === 'success'}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-sm disabled:opacity-50"
        />
        
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="privacy-compact"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            disabled={status === 'success'}
          />
          <label htmlFor="privacy-compact" className="text-xs text-gray-600 cursor-pointer">
            Ich akzeptiere die{' '}
            <a href="/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
              Datenschutzerklärung
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={!privacyAccepted || status === 'loading' || status === 'success'}
          className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Wird gesendet...' : status === 'success' ? '✓ Angemeldet' : 'Abonnieren'}
        </button>

        {message && (
          <div className={`text-xs p-2 rounded ${
            status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </form>
    );
  }

  // Light variant for colored backgrounds
  if (variant === 'light') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Deine E-Mail"
            required
            disabled={status === 'loading' || status === 'success'}
            className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 placeholder-white/70 text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!privacyAccepted || status === 'loading' || status === 'success'}
            className="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? '...' : status === 'success' ? '✓' : 'Anmelden'}
          </button>
        </div>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="privacy-light"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/30 text-purple-600 focus:ring-purple-500"
            disabled={status === 'success'}
          />
          <label htmlFor="privacy-light" className="text-xs text-white/90 cursor-pointer">
            Ich akzeptiere die{' '}
            <a href="/privacy" className="text-white underline hover:text-white/80" target="_blank" rel="noopener">
              Datenschutzerklärung
            </a>
          </label>
        </div>

        {message && (
          <div className={`text-xs p-2 rounded ${
            status === 'success' ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-200'
          }`}>
            {message}
          </div>
        )}
      </form>
    );
  }

  // Default variant (full section)
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Bleib auf dem Laufenden
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Erhalte wöchentlich die neuesten Artikel zu KI, Tech und digitaler Kultur direkt in dein
            Postfach.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              E-Mail-Adresse
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              disabled={status === 'loading' || status === 'success'}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 min-h-[44px]"
              aria-describedby="newsletter-description"
            />
            <button
              type="submit"
              disabled={!privacyAccepted || status === 'loading' || status === 'success'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
              aria-busy={status === 'loading'}
            >
              {status === 'loading' ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Wird gesendet...
                </span>
              ) : status === 'success' ? (
                '✓ Angemeldet'
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          <div className="mt-4 flex items-start justify-center">
            <input
              type="checkbox"
              id="privacy-consent"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
              disabled={status === 'success'}
            />
            <label htmlFor="privacy-consent" className="ml-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              Ich stimme den{' '}
              <a
                href="/privacy"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Datenschutzbestimmungen
              </a>{' '}
              zu und möchte den Newsletter erhalten. *
            </label>
          </div>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                status === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}
              role={status === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {message}
            </div>
          )}

          <p id="newsletter-description" className="mt-4 text-xs text-gray-600 dark:text-gray-400">
            Du kannst dich jederzeit über den Link in jeder E-Mail abmelden.
          </p>
        </div>
      </div>
    </section>
  );
}
