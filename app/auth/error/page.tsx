'use client';

import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'Configuration':
        return 'Es gibt ein Problem mit der Server-Konfiguration.';
      case 'AccessDenied':
        return 'Zugriff verweigert. Sie haben keine Berechtigung für diese Aktion.';
      case 'Verification':
        return 'Der Verifizierungstoken ist abgelaufen oder wurde bereits verwendet.';
      case 'OAuthSignin':
        return 'Fehler beim OAuth-Anmeldeprozess.';
      case 'OAuthCallback':
        return 'Fehler beim OAuth-Callback.';
      case 'OAuthCreateAccount':
        return 'Das OAuth-Konto konnte nicht erstellt werden.';
      case 'EmailCreateAccount':
        return 'Das E-Mail-Konto konnte nicht erstellt werden.';
      case 'Callback':
        return 'Fehler beim Callback-Prozess.';
      case 'OAuthAccountNotLinked':
        return 'Dieses OAuth-Konto ist bereits mit einem anderen Benutzer verknüpft.';
      case 'EmailSignin':
        return 'Fehler beim E-Mail-Versand.';
      case 'CredentialsSignin':
        return 'Die Anmeldedaten sind ungültig.';
      case 'SessionRequired':
        return 'Sie müssen angemeldet sein, um auf diese Seite zuzugreifen.';
      default:
        return 'Ein unbekannter Fehler ist aufgetreten.';
    }
  };

  const handleRetry = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-100">
            Anmeldefehler
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Fehlercode:</strong> {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Zur Startseite
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <Link 
              href="/auth/login" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Andere Anmeldemethode wählen
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}