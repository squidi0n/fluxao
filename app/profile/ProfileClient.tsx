'use client';

import { User, Settings, CreditCard, Shield, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    subscription?: string;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const menuItems = [
    {
      title: 'Einstellungen',
      description: 'Passwort ändern, Theme auswählen',
      icon: Settings,
      href: '/profile/settings',
      color: 'text-blue-600',
    },
    {
      title: 'Abonnement',
      description: 'Dein aktueller Plan und Upgrades',
      icon: CreditCard,
      href: '/profile/subscription',
      color: 'text-green-600',
    },
    {
      title: 'Sicherheit',
      description: 'Zwei-Faktor-Authentifizierung',
      icon: Shield,
      href: '/profile/security',
      color: 'text-purple-600',
    },
  ];

  if (user.role === 'ADMIN') {
    menuItems.push({
      title: 'Admin-Bereich',
      description: 'Verwaltung und Einstellungen',
      icon: User,
      href: '/admin',
      color: 'text-red-600',
    });
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mein Profil</h1>
        <p className="text-muted-foreground">Verwalte deine Kontoeinstellungen und Präferenzen</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Willkommen, {user.name || user.email}!</CardTitle>
            <CardDescription>
              Rolle: {user.role === 'ADMIN' ? 'Administrator' : 'Benutzer'} • Plan:{' '}
              {user.subscription || 'FREE'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <Button variant="destructive" onClick={handleLogout} className="ml-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </CardContent>
        </Card>

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Brauchst du Hilfe?</h3>
              <p className="text-sm text-muted-foreground">
                Unser Support-Team ist hier, um dir zu helfen.
              </p>
            </div>
            <Button variant="secondary">Support kontaktieren</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
