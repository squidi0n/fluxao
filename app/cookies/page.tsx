import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie-Einstellungen - FluxAO',
  description: 'Verwalten Sie Ihre Cookie-Einstellungen für FluxAO',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Cookie-Einstellungen
        </h1>

        <div className="space-y-8">
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Was sind Cookies?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie
              unsere Website besuchen. Sie helfen uns, die Website-Funktionalität zu verbessern und
              Ihr Nutzererlebnis zu personalisieren.
            </p>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Cookie-Kategorien
            </h2>

            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notwendige Cookies
                  </h3>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                    Immer aktiv
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diese Cookies sind für die Grundfunktionen der Website erforderlich. Sie
                  ermöglichen Navigation und Nutzung sicherer Bereiche.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                  <li>• Sitzungs-Cookies</li>
                  <li>• Sicherheits-Cookies</li>
                  <li>• Authentifizierungs-Cookies</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Funktionale Cookies
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diese Cookies speichern Ihre Präferenzen und verbessern die Benutzerfreundlichkeit
                  der Website.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                  <li>• Spracheinstellungen</li>
                  <li>• Theme-Präferenzen (Hell/Dunkel)</li>
                  <li>• Schriftgröße</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Analyse-Cookies</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website
                  interagieren.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                  <li>• Anonyme Nutzungsstatistiken</li>
                  <li>• Seitenaufrufe</li>
                  <li>• Verweildauer</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Marketing-Cookies</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diese Cookies werden verwendet, um relevante Werbung anzuzeigen.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                  <li>• Personalisierte Werbung</li>
                  <li>• Remarketing</li>
                  <li>• Social Media Tracking</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Ihre Rechte
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Sie haben jederzeit das Recht:</p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>✓ Ihre Cookie-Einstellungen zu ändern</li>
              <li>✓ Cookies in Ihrem Browser zu löschen</li>
              <li>✓ Die Speicherung von Cookies zu verhindern</li>
              <li>✓ Informationen über gespeicherte Daten anzufordern</li>
            </ul>
          </section>

          <div className="flex gap-4">
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Einstellungen speichern
            </button>
            <button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Alle ablehnen
            </button>
            <button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Alle akzeptieren
            </button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              Weitere Informationen finden Sie in unserer{' '}
              <a href="/privacy" className="text-primary-600 hover:text-primary-700">
                Datenschutzerklärung
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
