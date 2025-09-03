import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum - FluxAO',
  description: 'Impressum und rechtliche Informationen zu FluxAO',
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Impressum</h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Angaben gemäß § 5 TMG
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              FluxAO Media GmbH
              <br />
              Beispielstraße 123
              <br />
              12345 Berlin
              <br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Vertreten durch
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Geschäftsführer: Max Mustermann</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Kontakt</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Telefon: +49 (0) 30 123456789
              <br />
              E-Mail: kontakt@fluxao.com
              <br />
              Web: www.fluxao.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Registereintrag
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Eintragung im Handelsregister
              <br />
              Registergericht: Amtsgericht Berlin-Charlottenburg
              <br />
              Registernummer: HRB 123456 B
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Umsatzsteuer-ID
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
              <br />
              DE123456789
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Max Mustermann
              <br />
              Beispielstraße 123
              <br />
              12345 Berlin
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Haftungsausschluss
            </h2>

            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
              Haftung für Inhalte
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
              Haftung für Links
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
              übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
              oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Urheberrecht
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung
              und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
