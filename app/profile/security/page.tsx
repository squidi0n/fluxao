import { Shield, Smartphone, Key, AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserFromCookies } from '@/lib/auth';

export default async function SecurityPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sicherheit</h1>
        <p className="text-muted-foreground">
          Schütze dein Konto mit zusätzlichen Sicherheitsmaßnahmen
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
                <CardDescription>Zusätzliche Sicherheit für dein Konto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Die Zwei-Faktor-Authentifizierung ist derzeit nicht aktiviert.
            </p>
            <Button>2FA aktivieren</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Login-Verlauf</CardTitle>
                <CardDescription>Letzte Anmeldungen in deinem Konto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Keine verdächtigen Aktivitäten erkannt.
            </p>
            <Button variant="outline">Verlauf anzeigen</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <div>
                <CardTitle>Vertrauenswürdige Geräte</CardTitle>
                <CardDescription>Geräte mit Zugriff auf dein Konto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Aktuell 1 Gerät verbunden.</p>
            <Button variant="outline">Geräte verwalten</Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <CardTitle>Sicherheitstipps</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Verwende ein starkes, einzigartiges Passwort</li>
              <li>• Aktiviere die Zwei-Faktor-Authentifizierung</li>
              <li>• Überprüfe regelmäßig deinen Login-Verlauf</li>
              <li>• Melde dich ab, wenn du öffentliche Computer nutzt</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
