'use client';

import { Lock, Crown, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

interface PremiumGateProps {
  content: string;
  previewLength?: number;
  requiredPlan: 'PRO' | 'PREMIUM';
  title?: string;
  description?: string;
  className?: string;
  postId?: string;
}

interface UserSubscription {
  status: string;
  plan: string;
}

export function PremiumGate({
  content,
  previewLength = 300,
  requiredPlan,
  title = 'Premium Content',
  description,
  className,
  postId,
}: PremiumGateProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        // console.warn('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  // Check if user has access
  const hasAccess =
    subscription &&
    subscription.status === 'ACTIVE' &&
    (subscription.plan === requiredPlan ||
      (requiredPlan === 'PRO' && subscription.plan === 'PREMIUM'));

  // Generate preview content
  const previewContent =
    content.length > previewLength ? content.substring(0, previewLength) + '...' : content;

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: requiredPlan,
          returnUrl: window.location.href,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        // console.error('Failed to create checkout session');
      }
    } catch (error) {
      // console.error('Error initiating checkout:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Show full content if user has access
  if (hasAccess) {
    return (
      <div className={className}>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
      </div>
    );
  }

  // Show paywall for premium content
  return (
    <div className={cn('space-y-4', className)}>
      {/* Preview content */}
      <div className="prose prose-gray dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewContent) }} />
      </div>

      {/* Premium gate */}
      <Card className="border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            {requiredPlan === 'PREMIUM' ? (
              <Crown className="h-8 w-8 text-amber-500" />
            ) : (
              <Star className="h-8 w-8 text-blue-500" />
            )}
          </div>

          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            {title}
          </CardTitle>

          <Badge
            variant={requiredPlan === 'PREMIUM' ? 'default' : 'secondary'}
            className={cn(
              'font-semibold',
              requiredPlan === 'PREMIUM' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white',
            )}
          >
            {requiredPlan} Required
          </Badge>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {description && <p className="text-gray-600 dark:text-gray-300">{description}</p>}

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Continue reading with a {requiredPlan.toLowerCase()} subscription
            </p>

            <Button
              onClick={handleUpgrade}
              className={cn(
                'w-full',
                requiredPlan === 'PREMIUM'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-blue-500 hover:bg-blue-600',
              )}
            >
              {requiredPlan === 'PREMIUM' ? (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-400 pt-2 border-t">
            <p>Cancel anytime • 30-day money-back guarantee</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for posts with premium content
export function PremiumPost({
  post,
  premiumContent,
  className,
}: {
  post: any;
  premiumContent: any;
  className?: string;
}) {
  if (!premiumContent || !premiumContent.isActive) {
    return (
      <div className={className}>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
      </div>
    );
  }

  return (
    <PremiumGate
      content={post.content}
      previewLength={premiumContent.previewLength}
      requiredPlan={premiumContent.requiredPlan}
      title={premiumContent.title}
      description={premiumContent.description}
      postId={post.id}
      className={className}
    />
  );
}
