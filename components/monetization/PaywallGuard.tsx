'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Clock, ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaywallGuardProps {
  children: React.ReactNode;
  contentType?: 'article' | 'premium' | 'editor';
  showPreview?: boolean;
  previewLength?: number;
}

interface TrialStatus {
  hasTrialAccess: boolean;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  hasUsedTrial: boolean;
}

export function PaywallGuard({ 
  children, 
  contentType = 'article',
  showPreview = true,
  previewLength = 2
}: PaywallGuardProps) {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrialStatus() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/trial/status');
        const data = await response.json();
        setTrialStatus(data);
      } catch (error) {
        console.error('Error fetching trial status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrialStatus();
  }, [user?.id]);

  // Show full content for premium users and above
  if (user && ['PREMIUM', 'EDITOR', 'ADMIN'].includes(user.role || '')) {
    return <>{children}</>;
  }

  // Show full content during active trial
  if (trialStatus?.isTrialActive) {
    return (
      <div className="relative">
        {user && trialStatus.trialDaysRemaining <= 2 && (
          <div className="mb-4">
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Deine kostenlose Testphase läuft bald ab
                    </p>
                    <p className="text-xs text-amber-600">
                      Noch {trialStatus.trialDaysRemaining} Tag{trialStatus.trialDaysRemaining !== 1 ? 'e' : ''} verbleibend
                    </p>
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Jetzt upgraden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // For non-premium users without trial, show preview and paywall
  return (
    <div className="relative">
      {showPreview && (
        <div className="relative">
          <div className="paywall-content">
            {typeof children === 'string' 
              ? children.split('\n').slice(0, previewLength).join('\n')
              : <ContentPreview content={children} previewLength={previewLength} />
            }
          </div>
          <div className="paywall-blur absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white pointer-events-none"></div>
        </div>
      )}
      
      <PaywallCard 
        trialStatus={trialStatus} 
        user={user} 
        contentType={contentType}
      />
    </div>
  );
}

function ContentPreview({ content, previewLength }: { content: React.ReactNode, previewLength: number }) {
  if (typeof content === 'string') {
    const paragraphs = content.split('\n');
    return <>{paragraphs.slice(0, previewLength).join('\n')}</>;
  }

  // For React elements, try to extract first few paragraphs
  if (React.isValidElement(content)) {
    const contentString = React.Children.toArray(content.props?.children || []);
    return <div className="space-y-4">{contentString.slice(0, previewLength)}</div>;
  }

  return content;
}

interface PaywallCardProps {
  trialStatus: TrialStatus | null;
  user: any;
  contentType: string;
}

function PaywallCard({ trialStatus, user, contentType }: PaywallCardProps) {
  const handleStartTrial = async () => {
    if (!user) {
      window.location.href = '/auth/login?from=' + window.location.pathname;
      return;
    }

    try {
      const response = await fetch('/api/trial/start', { method: 'POST' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error starting trial:', error);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing?from=' + window.location.pathname;
  };

  // Trial available - show trial CTA
  if (user && trialStatus && !trialStatus.hasUsedTrial && !trialStatus.isTrialActive) {
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-blue-900">
            Starte deine kostenlose Testphase
          </CardTitle>
          <CardDescription className="text-blue-700">
            Erhalte 7 Tage lang vollen Zugriff auf alle Premium-Inhalte
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <ArrowRight className="h-4 w-4" />
              <span>Vollzugriff auf alle Artikel und Tutorials</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <ArrowRight className="h-4 w-4" />
              <span>Exklusive KI-Tools und Analysen</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <ArrowRight className="h-4 w-4" />
              <span>Keine Werbung</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <ArrowRight className="h-4 w-4" />
              <span>Jederzeit kündbar</span>
            </div>
          </div>
          
          <Button 
            onClick={handleStartTrial}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            size="lg"
          >
            <Zap className="mr-2 h-5 w-5" />
            7 Tage kostenlos testen
          </Button>
          
          <p className="text-xs text-blue-600 text-center">
            Keine Kreditkarte erforderlich • Automatisch kündbar
          </p>
        </CardContent>
      </Card>
    );
  }

  // Trial expired or no trial - show upgrade CTA
  return (
    <Card className="border-2 border-gradient-to-r from-purple-200 to-pink-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mb-3">
          <Crown className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle className="text-xl text-purple-900">
            Premium-Zugang erforderlich
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Premium
          </Badge>
        </div>
        <CardDescription className="text-purple-700">
          {trialStatus?.hasUsedTrial 
            ? 'Deine Testphase ist abgelaufen. Upgrade für vollen Zugriff.'
            : 'Dieser Inhalt ist nur für Premium-Mitglieder verfügbar.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
            <Shield className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-purple-900 text-sm">Unbegrenzter Zugriff</p>
              <p className="text-purple-700 text-xs">Auf alle Premium-Artikel und Tools</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
            <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-purple-900 text-sm">Exklusive Inhalte</p>
              <p className="text-purple-700 text-xs">Deep-Dives und Expertenanalysen</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
            size="lg"
          >
            <Crown className="mr-2 h-5 w-5" />
            Jetzt Premium werden
          </Button>
          
          {!user && (
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/auth/login?from=' + window.location.pathname}
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Bereits Mitglied? Einloggen
            </Button>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-xs text-purple-600">
            Ab 4,99€/Monat • Jederzeit kündbar • 30 Tage Geld-zurück-Garantie
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// CSS for content blurring effect
const paywallStyles = `
.paywall-content {
  position: relative;
  overflow: hidden;
  max-height: 200px;
}

.paywall-blur {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 60%,
    rgba(255, 255, 255, 0.8) 80%,
    rgba(255, 255, 255, 1) 100%
  );
}

@supports (backdrop-filter: blur(4px)) {
  .paywall-blur {
    backdrop-filter: blur(2px);
    background: linear-gradient(
      to bottom,
      transparent 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.6) 70%,
      rgba(255, 255, 255, 0.9) 100%
    );
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'paywall-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = paywallStyles;
    document.head.appendChild(style);
  }
}