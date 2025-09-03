'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  Globe, 
  Palette,
  Crown,
  CreditCard,
  BookOpen,
  Settings as SettingsIcon,
  Save,
  Loader2,
  Clock,
  Trash2,
  Key,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface UserSettings {
  emailNotifications: boolean;
  newsletterSubscription: boolean;
  commentNotifications: boolean;
  mentionNotifications: boolean;
  securityNotifications: boolean;
  profileVisible: boolean;
  showEmail: boolean;
  showLocation: boolean;
  allowDirectMessages: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  theme: string;
  contentLanguages?: string[];
  interestedTopics?: string[];
  hideAds: boolean;
  editorBio?: string;
  editorSpecialties?: string[];
  authorPageVisible: boolean;
}

interface TrialStatus {
  hasTrialAccess: boolean;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  hasUsedTrial: boolean;
}

export default function EnhancedSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchSettings();
      fetchTrialStatus();
    }
  }, [user, authLoading, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data);
      } else {
        setError(data.error || 'Fehler beim Laden der Einstellungen');
      }
    } catch (error) {
      setError('Netzwerkfehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Einstellungen erfolgreich gespeichert');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Fehler beim Speichern der Einstellungen');
      }
    } catch (error) {
      setError('Netzwerkfehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (authLoading || loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user || !settings) {
    return null;
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Einstellungen</h1>
            <p className="text-muted-foreground mt-2">
              Verwalte deine Account-Einstellungen und Präferenzen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            {trialStatus?.isTrialActive && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                {trialStatus.trialDaysRemaining}d Testphase
              </Badge>
            )}
          </div>
        </div>
      </div>

      {message && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Privatsphäre
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Darstellung
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Abonnement
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sicherheit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings 
            settings={settings} 
            user={user} 
            onUpdate={updateSetting} 
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings 
            settings={settings} 
            onUpdate={updateSetting} 
          />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings 
            settings={settings} 
            onUpdate={updateSetting} 
          />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings 
            settings={settings} 
            onUpdate={updateSetting} 
          />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionSettings 
            user={user} 
            trialStatus={trialStatus} 
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings user={user} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-8 pt-6 border-t">
        <Button onClick={handleSaveSettings} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichere...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role?: string }) {
  const config = {
    ADMIN: { color: 'bg-red-100 text-red-700 border-red-200', icon: Shield, label: 'Admin' },
    EDITOR: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: BookOpen, label: 'Editor' },
    PREMIUM: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Crown, label: 'Premium' },
    USER: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: User, label: 'User' },
  };

  const roleConfig = config[role as keyof typeof config] || config.USER;
  const Icon = roleConfig.icon;

  return (
    <Badge variant="outline" className={roleConfig.color}>
      <Icon className="h-3 w-3 mr-1" />
      {roleConfig.label}
    </Badge>
  );
}

function ProfileSettings({ 
  settings, 
  user, 
  onUpdate 
}: { 
  settings: UserSettings; 
  user: any; 
  onUpdate: (key: keyof UserSettings, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil-Einstellungen</CardTitle>
        <CardDescription>
          Grundlegende Informationen und regionale Einstellungen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Sprache</Label>
            <Select value={settings.language} onValueChange={(value) => onUpdate('language', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zeitzone</Label>
            <Select value={settings.timezone} onValueChange={(value) => onUpdate('timezone', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Berlin">Europa/Berlin</SelectItem>
                <SelectItem value="Europe/London">Europa/London</SelectItem>
                <SelectItem value="America/New_York">Amerika/New York</SelectItem>
                <SelectItem value="America/Los_Angeles">Amerika/Los Angeles</SelectItem>
                <SelectItem value="Asia/Tokyo">Asien/Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Datumsformat</Label>
            <Select value={settings.dateFormat} onValueChange={(value) => onUpdate('dateFormat', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(user.role === 'EDITOR' || user.role === 'ADMIN') && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Editor-Einstellungen</h3>
              
              <div className="space-y-2">
                <Label>Editor-Bio</Label>
                <Textarea
                  value={settings.editorBio || ''}
                  onChange={(e) => onUpdate('editorBio', e.target.value)}
                  placeholder="Erzähle etwas über dich als Autor..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {(settings.editorBio || '').length}/500 Zeichen
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autorenseite sichtbar</Label>
                  <p className="text-sm text-muted-foreground">
                    Zeige deine öffentliche Autorenseite
                  </p>
                </div>
                <Switch
                  checked={settings.authorPageVisible}
                  onCheckedChange={(checked) => onUpdate('authorPageVisible', checked)}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationSettings({ 
  settings, 
  onUpdate 
}: { 
  settings: UserSettings; 
  onUpdate: (key: keyof UserSettings, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Benachrichtigungseinstellungen</CardTitle>
        <CardDescription>
          Wähle aus, über welche Ereignisse du informiert werden möchtest
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-Mail-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">
                Erhalte wichtige Updates per E-Mail
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => onUpdate('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Newsletter-Abonnement</Label>
              <p className="text-sm text-muted-foreground">
                Wöchentlicher Newsletter mit neuen Inhalten
              </p>
            </div>
            <Switch
              checked={settings.newsletterSubscription}
              onCheckedChange={(checked) => onUpdate('newsletterSubscription', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Kommentar-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">
                Bei neuen Kommentaren auf deine Beiträge
              </p>
            </div>
            <Switch
              checked={settings.commentNotifications}
              onCheckedChange={(checked) => onUpdate('commentNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Erwähnungs-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">
                Wenn du in Kommentaren erwähnt wirst
              </p>
            </div>
            <Switch
              checked={settings.mentionNotifications}
              onCheckedChange={(checked) => onUpdate('mentionNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sicherheits-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">
                Wichtige Account-Sicherheitsmeldungen
              </p>
            </div>
            <Switch
              checked={settings.securityNotifications}
              onCheckedChange={(checked) => onUpdate('securityNotifications', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacySettings({ 
  settings, 
  onUpdate 
}: { 
  settings: UserSettings; 
  onUpdate: (key: keyof UserSettings, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privatsphäre-Einstellungen</CardTitle>
        <CardDescription>
          Kontrolliere die Sichtbarkeit deiner Informationen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profil öffentlich sichtbar</Label>
              <p className="text-sm text-muted-foreground">
                Andere können dein Profil sehen und besuchen
              </p>
            </div>
            <Switch
              checked={settings.profileVisible}
              onCheckedChange={(checked) => onUpdate('profileVisible', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-Mail-Adresse anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                E-Mail in deinem öffentlichen Profil anzeigen
              </p>
            </div>
            <Switch
              checked={settings.showEmail}
              onCheckedChange={(checked) => onUpdate('showEmail', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Standort anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Deinen Standort in deinem Profil anzeigen
              </p>
            </div>
            <Switch
              checked={settings.showLocation}
              onCheckedChange={(checked) => onUpdate('showLocation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Direkte Nachrichten erlauben</Label>
              <p className="text-sm text-muted-foreground">
                Andere können dir private Nachrichten senden
              </p>
            </div>
            <Switch
              checked={settings.allowDirectMessages}
              onCheckedChange={(checked) => onUpdate('allowDirectMessages', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSettings({ 
  settings, 
  onUpdate 
}: { 
  settings: UserSettings; 
  onUpdate: (key: keyof UserSettings, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Darstellungseinstellungen</CardTitle>
        <CardDescription>
          Passe das Aussehen der Anwendung an deine Vorlieben an
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Design-Theme</Label>
            <Select value={settings.theme} onValueChange={(value) => onUpdate('theme', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Hell</SelectItem>
                <SelectItem value="dark">Dunkel</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              System verwendet die Einstellung deines Geräts
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Werbung ausblenden</Label>
              <p className="text-sm text-muted-foreground">
                Verfügbar für Premium-Mitglieder
              </p>
            </div>
            <Switch
              checked={settings.hideAds}
              onCheckedChange={(checked) => onUpdate('hideAds', checked)}
              disabled={true} // TODO: Enable for premium users
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionSettings({ 
  user, 
  trialStatus 
}: { 
  user: any; 
  trialStatus: TrialStatus | null;
}) {
  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Aktueller Status</CardTitle>
          <CardDescription>
            Übersicht über deinen aktuellen Zugang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <RoleBadge role={user.role} />
              <p className="text-sm text-muted-foreground mt-2">
                {user.role === 'PREMIUM' && 'Vollzugriff auf alle Premium-Inhalte'}
                {user.role === 'EDITOR' && 'Zugang zum Content-Management-System'}
                {user.role === 'ADMIN' && 'Vollzugriff auf alle Administrationsfeatures'}
                {user.role === 'USER' && trialStatus?.isTrialActive && 
                  `${trialStatus.trialDaysRemaining} Tage Testphase verbleibend`}
                {user.role === 'USER' && !trialStatus?.isTrialActive && 
                  'Basis-Zugang mit Einschränkungen'}
              </p>
            </div>
            {user.role === 'USER' && (
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Crown className="mr-2 h-4 w-4" />
                Upgraden
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison for Users */}
      {user.role === 'USER' && (
        <Card>
          <CardHeader>
            <CardTitle>Premium upgraden</CardTitle>
            <CardDescription>
              Erhalte Vollzugriff auf alle Features und Inhalte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-semibold">Kostenlos</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Basis-Artikel lesen
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    7-Tage kostenlose Testphase
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    Eingeschränkter Zugang nach Testphase
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">Premium</h4>
                  <Badge className="bg-purple-600">4,99€/Monat</Badge>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unbegrenzter Zugriff auf alle Inhalte
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Exklusive Premium-Artikel
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    KI-Tools und erweiterte Features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Werbefrei
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                  Jetzt upgraden
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SecuritySettings({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Passwort & Anmeldung</CardTitle>
          <CardDescription>
            Verwalte deine Anmeldedaten und Sicherheitseinstellungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Passwort ändern</Label>
              <p className="text-sm text-muted-foreground">
                Zuletzt geändert: vor 3 Monaten
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Key className="mr-2 h-4 w-4" />
              Passwort ändern
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Zwei-Faktor-Authentifizierung</Label>
              <p className="text-sm text-muted-foreground">
                Zusätzliche Sicherheit für deinen Account
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Shield className="mr-2 h-4 w-4" />
              Einrichten
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account-Verwaltung</CardTitle>
          <CardDescription>
            Erweiterte Account-Optionen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Account exportieren</Label>
              <p className="text-sm text-muted-foreground">
                Lade alle deine Daten herunter
              </p>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Account löschen</Label>
              <p className="text-sm text-muted-foreground">
                Permanent und unwiderruflich
              </p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Account löschen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}