import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { auth } from '@/auth';

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  // Kein komplizierter Redirect - zeige einfach den Status
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Nicht angemeldet</h1>
        <p className="mb-4">Du musst dich erst anmelden um dein Profil zu sehen.</p>
        <Link href="/auth/login">
          <Button>Zum Login</Button>
        </Link>
      </div>
    );
  }

  // User ist eingeloggt - zeige Profil
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Mein Profil</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Deine Daten</h2>
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {user.name || 'Nicht gesetzt'}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Rolle:</strong> {user.role}
          </p>
          <p>
            <strong>Plan:</strong> FREE
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/profile/settings" className="block">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">⚙️ Einstellungen</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Passwort ändern, Theme wählen
            </p>
          </div>
        </Link>

        <Link href="/comments" className="block">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">💬 Meine Kommentare</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kommentare verwalten</p>
          </div>
        </Link>

        <Link href="/notifications" className="block">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">🔔 Benachrichtigungen</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Einstellungen verwalten</p>
          </div>
        </Link>

        <Link href="/newsletter" className="block">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">📧 Newsletter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Newsletter abonnieren</p>
          </div>
        </Link>

        <Link href="/profile/subscription" className="block">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">💎 Abonnement</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plan verwalten</p>
          </div>
        </Link>

        <Link href="/profile/security" className="block">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">🔐 Sicherheit</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">2FA aktivieren</p>
          </div>
        </Link>

        {user.role === 'ADMIN' && (
          <Link href="/admin" className="block">
            <div className="bg-gray-800 dark:bg-gray-200 border border-gray-700 dark:border-gray-300 rounded-lg p-4 hover:shadow-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-all">
              <h3 className="font-semibold text-white dark:text-gray-900">👨‍💼 Admin Panel</h3>
              <p className="text-sm text-gray-300 dark:text-gray-600">Verwaltung & Einstellungen</p>
            </div>
          </Link>
        )}
      </div>

      <div className="mt-8">
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="destructive">
            Abmelden
          </Button>
        </form>
      </div>
    </div>
  );
}
