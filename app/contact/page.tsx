import { Metadata } from 'next';
import Link from 'next/link';

import { ContactForm } from '@/components/ContactForm';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Nehmen Sie Kontakt mit dem FluxAO Team auf. Wir freuen uns auf Ihre Nachricht, Feedback oder Ihre Ideen.',
  openGraph: {
    title: 'Kontakt | FluxAO',
    description:
      'Nehmen Sie Kontakt mit dem FluxAO Team auf. Wir freuen uns auf Ihre Nachricht, Feedback oder Ihre Ideen.',
  },
};

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4">Kontakt</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Haben Sie Fragen, Feedback oder möchten Sie mit uns zusammenarbeiten? Wir freuen uns auf
          Ihre Nachricht!
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Nachricht senden</h2>
            <ContactForm />
          </Card>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Kontaktinformationen</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">E-Mail</p>
                <a
                  href="mailto:kontakt@fluxao.com"
                  className="text-primary-600 hover:text-primary-700"
                >
                  kontakt@fluxao.com
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Newsletter</p>
                <a
                  href="mailto:newsletter@fluxao.com"
                  className="text-primary-600 hover:text-primary-700"
                >
                  newsletter@fluxao.com
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Presse</p>
                <a
                  href="mailto:presse@fluxao.com"
                  className="text-primary-600 hover:text-primary-700"
                >
                  presse@fluxao.com
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Social Media</h3>
            <div className="space-y-3">
              <a
                href="https://twitter.com/fluxao"
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Twitter/X
              </a>
              <a
                href="https://github.com/fluxao"
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://linkedin.com/company/fluxao"
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Verpassen Sie keine News! Abonnieren Sie unseren Newsletter für die neuesten
              KI-Entwicklungen.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              Zum Newsletter
            </Link>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Häufig gestellte Fragen</h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Wie oft erscheint der Newsletter?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Unser Newsletter erscheint 3x wöchentlich mit den wichtigsten News aus KI und Tech.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Kann ich Gastbeiträge einreichen?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ja! Senden Sie uns Ihre Vorschläge an redaktion@fluxao.com. Wir prüfen jeden Beitrag
              sorgfältig.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Bieten Sie Werbemöglichkeiten an?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Für Werbekooperationen kontaktieren Sie uns bitte unter werbung@fluxao.com.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Wie kann ich den Newsletter abbestellen?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              In jeder Newsletter-E-Mail finden Sie einen Abmeldelink am Ende der Nachricht.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
