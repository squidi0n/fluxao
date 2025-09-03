'use client';

import { Check, Star, TrendingUp, Shield, Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (plan: 'PRO') => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setIsLoading(plan);
    setError('');

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Fehler beim Erstellen der Bezahlsession');
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      id: 'FREE',
      name: 'Kostenlos',
      price: 0,
      priceYearly: 0,
      icon: Zap,
      description: 'Perfekt für den Einstieg',
      features: [
        'Alle Artikel lesen',
        'Kommentare schreiben',
        'Newsletter erhalten',
        'Basis-Profil anpassen',
      ],
      popular: false,
    },
    {
      id: 'PRO',
      name: 'Premium',
      price: 4.99,
      priceYearly: 49.99,
      icon: Crown,
      description: 'Für ambitionierte Creator',
      features: [
        'Alles aus Kostenlos',
        'Premium-Inhalte',
        'Erweiterte Analytics',
        'Werbefreie Erfahrung',
        'Prioritäts-Support',
        'Früher Zugang zu neuen Features',
        '7 Tage kostenlos testen',
      ],
      popular: true,
    },
  ];

  const getDisplayPrice = (plan: typeof plans[0]) => {
    if (plan.price === 0) return 'Kostenlos';
    const price = isYearly ? plan.priceYearly : plan.price;
    return `€${price.toFixed(2)}`;
  };

  const getSavings = () => {
    const monthlyTotal = 4.99 * 12;
    const savings = monthlyTotal - 49.99;
    return Math.round((savings / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Star className="mr-1 h-3 w-3" />
            7 Tage kostenlos testen
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Wählen Sie Ihren Plan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Schalten Sie Premium-Features frei und bringen Sie Ihr Erlebnis auf die nächste Stufe
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : ''}>
              Monatlich
            </Label>
            <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
            <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : ''}>
              Jährlich
              <Badge className="ml-2" variant="default">
                {getSavings()}% sparen
              </Badge>
            </Label>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className={plan.popular ? 'relative border-primary shadow-lg' : 'relative'}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Beliebtester Plan
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-8 w-8 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{getDisplayPrice(plan)}</span>
                    {plan.price > 0 && (
                      <>
                        <span className="text-muted-foreground ml-2">
                          /{isYearly ? 'Jahr' : 'Monat'}
                        </span>
                        {isYearly && (
                          <div className="text-sm text-green-600 mt-1">
                            {getSavings()}% sparen
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => plan.id === 'PRO' ? handleSubscribe('PRO') : null}
                    disabled={plan.id === 'FREE' ? (user ? true : false) : isLoading === 'PRO'}
                  >
                    {plan.id === 'FREE'
                      ? (user ? 'Aktueller Plan' : 'Loslegen')
                      : isLoading === 'PRO'
                      ? 'Wird verarbeitet...'
                      : 'Kostenlos testen'
                    }
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Detaillierter Feature-Vergleich</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Feature</th>
                    <th className="text-center p-4">Kostenlos</th>
                    <th className="text-center p-4">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">Blog-Artikel</td>
                    <td className="text-center p-4">Alle lesen</td>
                    <td className="text-center p-4">Alle lesen</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Premium-Inhalte</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Analytics Dashboard</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Werbefreie Erfahrung</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Prioritäts-Support</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">✅</td>
                  </tr>
                  <tr>
                    <td className="p-4">Früher Zugang zu Features</td>
                    <td className="text-center p-4">❌</td>
                    <td className="text-center p-4">✅</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">SSL-gesichert</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Jederzeit kündbar</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">7 Tage kostenlos testen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}