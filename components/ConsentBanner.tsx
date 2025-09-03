'use client';

import { X, Shield, BarChart3, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

interface ConsentBannerProps {
  onConsentGiven?: (consent: ConsentPreferences) => void;
}

export default function ConsentBanner({ onConsentGiven }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: false,
    marketing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const checkConsent = async () => {
      try {
        const response = await fetch('/api/analytics/consent');
        const data = await response.json();

        if (!data.hasConsent) {
          setIsVisible(true);
        }
      } catch (error) {
        // console.error('Failed to check consent status:', error);
        setIsVisible(true);
      }
    };

    checkConsent();
  }, []);

  const handleAcceptAll = async () => {
    const fullConsent = { analytics: true, marketing: true };
    await submitConsent(fullConsent);
  };

  const handleAcceptNecessary = async () => {
    const necessaryOnly = { analytics: false, marketing: false };
    await submitConsent(necessaryOnly);
  };

  const handleCustomSubmit = async () => {
    await submitConsent(preferences);
  };

  const submitConsent = async (consent: ConsentPreferences) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/analytics/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consent),
      });

      if (response.ok) {
        setIsVisible(false);
        onConsentGiven?.(consent);
      } else {
        // console.error('Failed to record consent');
      }
    } catch (error) {
      // console.error('Error submitting consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Datenschutz & Cookies
              </h2>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Wir verwenden Cookies und ähnliche Technologien, um unsere Website zu verbessern und
            Ihnen personalisierte Inhalte anzubieten. Ihre Privatsphäre ist uns wichtig.
          </p>

          {!showDetails ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Alle akzeptieren
              </button>
              <button
                onClick={handleAcceptNecessary}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Nur notwendige
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Anpassen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="essential"
                    checked={true}
                    disabled={true}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="essential"
                      className="block font-medium text-gray-900 dark:text-white"
                    >
                      Notwendige Cookies
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Diese Cookies sind für die Grundfunktionen der Website erforderlich. Sie
                      können nicht deaktiviert werden.
                    </p>
                  </div>
                  <Shield className="h-5 w-5 text-green-600 mt-1" />
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="analytics"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="analytics"
                      className="block font-medium text-gray-900 dark:text-white"
                    >
                      Analyse & Performance
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Hilft uns zu verstehen, wie Besucher unsere Website nutzen. Alle Daten sind
                      anonymisiert und GDPR-konform.
                    </p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-1" />
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="marketing"
                      className="block font-medium text-gray-900 dark:text-white"
                    >
                      Marketing & Newsletter
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Ermöglicht personalisierte Newsletter und Marketing-Inhalte. Sie können sich
                      jederzeit abmelden.
                    </p>
                  </div>
                  <Mail className="h-5 w-5 text-purple-600 mt-1" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={handleCustomSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Auswahl speichern
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Zurück
                </button>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                Ihre Einstellungen werden 13 Monate gespeichert. Sie können diese jederzeit in den{' '}
                <a
                  href="/datenschutz"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Datenschutzeinstellungen
                </a>{' '}
                ändern.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
