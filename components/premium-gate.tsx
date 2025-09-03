'use client';

import { Lock, Crown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PremiumGateProps {
  children: React.ReactNode;
  requiredPlan?: 'PRO' | 'ENTERPRISE';
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function PremiumGate({
  children,
  requiredPlan = 'PRO',
  fallback,
  showUpgradePrompt = true,
}: PremiumGateProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userPlan, setUserPlan] = useState<string>('FREE');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        const plan = data.plan || 'FREE';
        setUserPlan(plan);

        if (requiredPlan === 'PRO') {
          setHasAccess(plan === 'PRO' || plan === 'ENTERPRISE');
        } else if (requiredPlan === 'ENTERPRISE') {
          setHasAccess(plan === 'ENTERPRISE');
        } else {
          setHasAccess(true);
        }
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      // console.error('Failed to check subscription:', error);
      setHasAccess(false);
    }
  };

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showUpgradePrompt) {
      return null;
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Premium Content</CardTitle>
          <CardDescription>
            This content is available for {requiredPlan} subscribers only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Upgrade to {requiredPlan} to unlock:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Access to all premium content</li>
                <li>Advanced analytics dashboard</li>
                <li>Ad-free experience</li>
                <li>Priority support</li>
                {requiredPlan === 'ENTERPRISE' && (
                  <>
                    <li>Custom domain support</li>
                    <li>API access</li>
                    <li>Team collaboration tools</li>
                  </>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/pricing')}>
              <Sparkles className="mr-2 h-4 w-4" />
              View Plans
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

export function PremiumBadge({ plan }: { plan?: string }) {
  if (!plan || plan === 'FREE') return null;

  const icons = {
    PRO: <Crown className="h-3 w-3" />,
    ENTERPRISE: <Sparkles className="h-3 w-3" />,
  };

  const colors = {
    PRO: 'bg-amber-500',
    ENTERPRISE: 'bg-purple-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${colors[plan as keyof typeof colors] || 'bg-gray-500'}`}
    >
      {icons[plan as keyof typeof icons]}
      {plan}
    </span>
  );
}
