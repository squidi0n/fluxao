'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Clock,
  Star,
  Users,
  BookOpen,
  Loader2,
  Gift
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TrialStatus {
  hasTrialAccess: boolean;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  hasUsedTrial: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    included: boolean;
  }[];
  popular?: boolean;
  cta: string;
  stripePriceId: {
    monthly: string;
    yearly: string;
  };
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Kostenlos',
    description: 'Für Einsteiger und Hobbyisten',
    price: { monthly: 0, yearly: 0 },
    features: [
      {
        icon: BookOpen,
        title: 'Basis-Artikel',
        description: 'Zugang zu öffentlichen Artikeln',
        included: true
      },
      {
        icon: Clock,
        title: '7-Tage Testphase',
        description: 'Kostenloser Zugang zu Premium-Inhalten',
        included: true
      },
      {
        icon: Users,
        title: 'Community-Zugang',
        description: 'Kommentare und Diskussionen',
        included: true
      },
      {
        icon: Crown,
        title: 'Premium-Inhalte',
        description: 'Vollzugriff nach Testphase',
        included: false
      },
      {
        icon: Sparkles,
        title: 'KI-Tools',
        description: 'Erweiterte KI-basierte Features',
        included: false
      },
      {
        icon: Shield,
        title: 'Werbefrei',
        description: 'Ohne störende Werbung',
        included: false
      }
    ],
    cta: 'Kostenlosen Account erstellen',
    stripePriceId: { monthly: '', yearly: '' }
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Für ernsthafte Tech-Enthusiasten',
    price: { monthly: 4.99, yearly: 49.99 },
    popular: true,
    features: [
      {
        icon: BookOpen,
        title: 'Alle Artikel',
        description: 'Unbegrenzter Zugang zu allen Inhalten',
        included: true
      },
      {
        icon: Crown,
        title: 'Premium-Inhalte',
        description: 'Exklusive Deep-Dives und Analysen',
        included: true
      },
      {
        icon: Sparkles,
        title: 'KI-Tools',
        description: 'Code-Analyse, Zusammenfassungen, Empfehlungen',
        included: true
      },
      {
        icon: Shield,
        title: 'Werbefrei',
        description: 'Konzentriertes Lesen ohne Ablenkung',
        included: true
      },
      {
        icon: Zap,
        title: 'Früher Zugang',
        description: 'Neue Features vor allen anderen',
        included: true
      },
      {
        icon: Users,
        title: 'Premium-Community',
        description: 'Exklusiver Zugang zur Premium-Community',
        included: true
      }
    ],
    cta: 'Premium werden',
    stripePriceId: { 
      monthly: 'price_premium_monthly', 
      yearly: 'price_premium_yearly' 
    }
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Für Teams und Unternehmen',
    price: { monthly: 19.99, yearly: 199.99 },
    features: [
      {
        icon: BookOpen,
        title: 'Alles aus Premium',
        description: 'Alle Premium-Features inklusive',
        included: true
      },
      {
        icon: Users,
        title: 'Team-Management',
        description: 'Bis zu 10 Team-Mitglieder',
        included: true
      },
      {
        icon: Sparkles,
        title: 'Advanced KI',
        description: 'Erweiterte KI-Tools und API-Zugang',
        included: true
      },
      {
        icon: Shield,
        title: 'Priority Support',
        description: 'Bevorzugter Kundensupport',
        included: true
      },
      {
        icon: Crown,
        title: 'Custom Content',
        description: 'Maßgeschneiderte Inhalte auf Anfrage',
        included: true
      },
      {
        icon: Zap,
        title: 'White-Label',
        description: 'Eigenes Branding verfügbar',
        included: true
      }
    ],
    cta: 'Professional werden',
    stripePriceId: { 
      monthly: 'price_pro_monthly', 
      yearly: 'price_pro_yearly' 
    }
  }
];

export default function EnhancedPricingPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fromPage = searchParams.get('from');

  useEffect(() => {
    if (user) {
      fetchTrialStatus();
    }
  }, [user]);

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch('/api/trial/status');
      const data = await response.json();
      
      if (response.ok) {
        setTrialStatus(data);
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    }
  };

  const handleStartTrial = async () => {
    if (!user) {
      router.push(`/auth/login?from=${encodeURIComponent('/pricing/enhanced')}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/trial/start', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setMessage('7-Tage Testphase erfolgreich gestartet!');
        setTimeout(() => {
          router.push(fromPage || '/');
        }, 1500);
      } else {
        setError(data.error || 'Fehler beim Starten der Testphase');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      router.push(`/auth/login?from=${encodeURIComponent('/pricing/enhanced')}`);
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan || planId === 'free') return;

    setLoading(true);
    try {
      const priceId = isYearly ? plan.stripePriceId.yearly : plan.stripePriceId.monthly;
      
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/profile/subscription?success=true`,
          cancelUrl: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const getUserPlanStatus = () => {
    if (!user) return null;
    
    if (user.role === 'PREMIUM') return 'premium';
    if (user.role === 'EDITOR' || user.role === 'ADMIN') return 'pro';
    if (trialStatus?.isTrialActive) return 'trial';
    
    return 'free';
  };

  const currentPlan = getUserPlanStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container max-w-6xl py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Wähle den <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">perfekten Plan</span> für dich
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Erhalte Zugang zu Premium-Inhalten, KI-Tools und einer exklusiven Community von Tech-Enthusiasten
          </p>

          {/* Trial Status */}
          {user && trialStatus && (
            <div className="mb-8">
              {trialStatus.isTrialActive && (
                <Alert className="max-w-md mx-auto border-blue-200 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>{trialStatus.trialDaysRemaining} Tage</strong> Testphase verbleibend
                  </AlertDescription>
                </Alert>
              )}
              
              {!trialStatus.hasUsedTrial && !trialStatus.isTrialActive && (
                <Alert className="max-w-md mx-auto border-green-200 bg-green-50">
                  <Gift className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Du hast Anspruch auf eine <strong>7-Tage kostenlose Testphase</strong>!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 p-1 bg-white dark:bg-gray-800 rounded-xl border max-w-xs mx-auto">
            <Label 
              htmlFor="billing-toggle" 
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                !isYearly ? 'bg-purple-100 text-purple-700 font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monatlich
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label 
              htmlFor="billing-toggle" 
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                isYearly ? 'bg-purple-100 text-purple-700 font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Jährlich 
              <Badge className="bg-green-100 text-green-700 text-xs">-17%</Badge>
            </Label>
          </div>
        </div>

        {message && (
          <Alert className="mb-6 max-w-md mx-auto border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-md mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            const isCurrentPlan = currentPlan === plan.id;
            const isFreePlan = plan.id === 'free';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.popular 
                    ? 'border-purple-200 shadow-lg transform scale-105' 
                    : 'border-gray-200 hover:border-purple-200'
                } ${
                  isCurrentPlan ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-medium">
                    <Star className="inline h-4 w-4 mr-1" />
                    Beliebtester Plan
                  </div>
                )}
                
                <CardHeader className={plan.popular ? 'pt-12' : ''}>
                  <div className="text-center">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="mb-6">{plan.description}</CardDescription>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        {price === 0 ? 'Kostenlos' : `${price}€`}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground ml-1">
                          /{isYearly ? 'Jahr' : 'Monat'}
                        </span>
                      )}
                      {isYearly && price > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          Spare {Math.round(((price * 12) / 10 - price) / (price * 12) * 100)}%
                        </div>
                      )}
                    </div>

                    {isCurrentPlan && (
                      <Badge className="mb-4 bg-green-100 text-green-700">
                        Aktueller Plan
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`p-1 rounded-full flex-shrink-0 ${
                            feature.included 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {feature.included ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <div className={feature.included ? '' : 'opacity-50'}>
                            <p className="font-medium text-sm">{feature.title}</p>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center">
                    {isFreePlan && !user && (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => router.push('/auth/login')}
                      >
                        Account erstellen
                      </Button>
                    )}

                    {isFreePlan && user && !trialStatus?.hasUsedTrial && !trialStatus?.isTrialActive && (
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                        onClick={handleStartTrial}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        7 Tage kostenlos testen
                      </Button>
                    )}

                    {!isFreePlan && !isCurrentPlan && (
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                            : ''
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Crown className="h-4 w-4 mr-2" />
                        )}
                        {plan.cta}
                      </Button>
                    )}

                    {isCurrentPlan && !isFreePlan && (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => router.push('/profile/subscription')}
                      >
                        Plan verwalten
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-8">Häufig gestellte Fragen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold mb-2">Kann ich jederzeit kündigen?</h3>
              <p className="text-muted-foreground text-sm">
                Ja, du kannst dein Abonnement jederzeit kündigen. Dein Zugang bleibt bis zum Ende der bezahlten Periode aktiv.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Was passiert nach der Testphase?</h3>
              <p className="text-muted-foreground text-sm">
                Nach 7 Tagen hast du weiterhin Zugang zu kostenlosen Inhalten, aber Premium-Features sind eingeschränkt.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Gibt es eine Geld-zurück-Garantie?</h3>
              <p className="text-muted-foreground text-sm">
                Ja, wir bieten eine 30-Tage Geld-zurück-Garantie für alle Premium-Pläne.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Welche Zahlungsmethoden werden akzeptiert?</h3>
              <p className="text-muted-foreground text-sm">
                Wir akzeptieren alle gängigen Kreditkarten, SEPA-Lastschrift und weitere Zahlungsmethoden über Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}