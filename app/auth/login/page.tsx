'use client';

import { Loader2, Mail, Lock, Chrome, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Ungültige Anmeldedaten');
      } else if (result?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      setError('OAuth Anmeldung fehlgeschlagen');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Anmelden</CardTitle>
          <CardDescription className="text-center">
            Wähle deine bevorzugte Anmeldemethode
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Providers */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Mit Google anmelden
            </Button>

            {/* Weitere Provider können hier hinzugefügt werden */}
            {/* <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              Mit GitHub anmelden
            </Button> */}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                Oder mit E-Mail
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline w-4 h-4 mr-2" />
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="inline w-4 h-4 mr-2" />
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmeldung läuft...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>

        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Noch kein Konto?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Jetzt registrieren
            </Link>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-muted-foreground hover:underline"
          >
            Passwort vergessen?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
