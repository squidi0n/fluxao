import { Check } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserFromCookies } from '@/lib/auth';

export default async function SubscriptionPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect('/auth/login');
  }

  const plans = [
    {
      name: 'Kostenlos',
      price: '0€',
      features: ['Alle Artikel lesen', 'Kommentare schreiben', 'Newsletter erhalten'],
      current: user.subscription === 'FREE' || !user.subscription,
    },
    {
      name: 'Premium',
      price: '4,99€',
      priceYearly: '49,99€',
      features: [
        'Alles aus Kostenlos',
        'Premium-Inhalte',
        'Erweiterte Analytics',
        'Werbefreie Erfahrung',
        'Prioritäts-Support',
        '7 Tage kostenlos testen',
      ],
      current: user.subscription === 'PRO',
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Abonnement</h1>
        <p className="text-muted-foreground">
          Dein aktueller Plan: <span className="font-semibold">{user.subscription || 'FREE'}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.current ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">{plan.price}</span>
                {plan.price !== '0€' && (
                  <>
                    <span className="text-muted-foreground">/Monat</span>
                    {plan.priceYearly && (
                      <div className="text-sm text-muted-foreground">
                        oder {plan.priceYearly}/Jahr
                      </div>
                    )}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <Button disabled className="w-full">
                  Aktueller Plan
                </Button>
              ) : (
                <Button className="w-full">{plan.price === '0€' ? 'Downgrade' : 'Upgrade'}</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
