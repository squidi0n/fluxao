'use client';

export const dynamic = 'force-dynamic';

import {
  Camera,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Loader2,
  Save,
  Sun,
  Moon,
  Monitor,
  Mail,
  Bell,
  Shield,
  Eye,
  Download,
  Cookie,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { useTheme } from '@/components/theme/ThemeProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  youtube: string;
}

interface PrivacySettings {
  // Existing settings
  emailNotifications: boolean;
  newsletterSubscription: boolean;
  commentNotifications: boolean;
  mentionNotifications: boolean;
  securityNotifications: boolean;
  
  // Phase 1: Enhanced Newsletter & Notification Settings
  articleNotifications: boolean;
  weeklyDigest: boolean;
  newsletterFrequency: 'weekly' | 'biweekly' | 'monthly';
  notificationTopics: string[];
  digestDeliveryDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  
  // Phase 2: Profile Visibility Controls
  profileVisibilityLevel: 'public' | 'private' | 'followers';
  commentDisplayName: 'full_name' | 'username' | 'anonymous';
  avatarVisibility: 'public' | 'private' | 'followers';
  
  // Phase 3: GDPR Compliance Settings
  analyticsOptOut: boolean;
  cookiePreferences: Record<string, boolean>;
}

export default function ProfileSettingsPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    emailNotifications: true,
    newsletterSubscription: true,
    commentNotifications: true,
    mentionNotifications: true,
    securityNotifications: true,
    articleNotifications: true,
    weeklyDigest: true,
    newsletterFrequency: 'weekly',
    notificationTopics: [],
    digestDeliveryDay: 'friday',
    profileVisibilityLevel: 'public',
    commentDisplayName: 'full_name',
    avatarVisibility: 'public',
    analyticsOptOut: false,
    cookiePreferences: {
      essential: true,
      analytics: true,
      marketing: false,
    },
  });

  const [dataExportStatus, setDataExportStatus] = useState<{
    lastRequestedAt?: string;
    lastDeliveredAt?: string;
    canRequest: boolean;
  }>({ canRequest: true });

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    username: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    youtube: '',
  });

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrivacySettingChange = (field: keyof PrivacySettings, value: any) => {
    setPrivacySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleTopicToggle = (topic: string) => {
    setPrivacySettings((prev) => ({
      ...prev,
      notificationTopics: prev.notificationTopics.includes(topic)
        ? prev.notificationTopics.filter(t => t !== topic)
        : [...prev.notificationTopics, topic]
    }));
  };

  const savePrivacySettings = async () => {
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/profile/privacy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacySettings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Privatsphäre-Einstellungen erfolgreich gespeichert');
      } else {
        setError(data.error || 'Fehler beim Speichern der Einstellungen');
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDataExport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/data-export', {
        method: 'POST',
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'data-export.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        setMessage('Datenexport wurde heruntergeladen');
        // Refresh export status
        fetchDataExportStatus();
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Exportieren der Daten');
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDataExportStatus = async () => {
    try {
      const response = await fetch('/api/profile/data-export');
      if (response.ok) {
        const data = await response.json();
        setDataExportStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch export status:', error);
    }
  };

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch('/api/profile/privacy-settings');
      if (response.ok) {
        const settings = await response.json();
        setPrivacySettings({
          ...privacySettings,
          ...settings,
          notificationTopics: settings.notificationTopics || [],
          cookiePreferences: settings.cookiePreferences || privacySettings.cookiePreferences,
        });
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();

      // Add profile data
      Object.entries(profileData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add avatar if changed
      if (avatarPreview && fileInputRef.current?.files?.[0]) {
        formData.append('avatar', fileInputRef.current.files[0]);
      }

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profil erfolgreich aktualisiert');
        // Refresh user data
        await refresh();
        // Redirect to profile page after a short delay
        setTimeout(() => {
          router.push(`/profile/${profileData.username || user?.id}`);
        }, 1500);
      } else {
        setError(data.error || 'Fehler beim Aktualisieren des Profils');
      }
    } catch (error) {
      // console.error('Profile update error:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Bist du sicher, dass du deinen Account löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/auth/signout');
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Löschen des Accounts');
      }
    } catch (error) {
      // console.error('Account deletion error:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
      fetchDataExportStatus();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profil-Einstellungen</h1>
        <p className="text-muted-foreground mt-2">
          Verwalte deine Account-Einstellungen und Profil-Informationen
        </p>
      </div>

      {message && (
        <Alert className="mb-6">
          <AlertDescription className="text-green-600">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="subscription">Abo</TabsTrigger>
          <TabsTrigger value="appearance">Design</TabsTrigger>
          <TabsTrigger value="privacy">Privat</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil-Informationen</CardTitle>
              <CardDescription>
                Aktualisiere deine Profil-Informationen und wie andere dich sehen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || user?.image || ''} />
                    <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Avatar ändern
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG oder GIF. Maximal 5MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Basic Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Anzeigename</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Max Mustermann"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Benutzername</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) =>
                        handleInputChange(
                          'username',
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                        )
                      }
                      placeholder="maxmustermann"
                      pattern="[a-z0-9_]+"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Dein eindeutiger Benutzername. Nur Kleinbuchstaben, Zahlen und Unterstriche.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Standort</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Berlin, Deutschland"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Über mich</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Erzähle etwas über dich..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {profileData.bio.length}/500 Zeichen
                  </p>
                </div>

                <Separator />

                {/* Social Links */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Soziale Netzwerke</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="github">
                        <Github className="inline h-4 w-4 mr-2" />
                        GitHub
                      </Label>
                      <Input
                        id="github"
                        value={profileData.github}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        placeholder="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter">
                        <Twitter className="inline h-4 w-4 mr-2" />
                        Twitter
                      </Label>
                      <Input
                        id="twitter"
                        value={profileData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        placeholder="@username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin">
                        <Linkedin className="inline h-4 w-4 mr-2" />
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        value={profileData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        placeholder="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">
                        <Instagram className="inline h-4 w-4 mr-2" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        value={profileData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="@username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="youtube">
                        <Youtube className="inline h-4 w-4 mr-2" />
                        YouTube
                      </Label>
                      <Input
                        id="youtube"
                        value={profileData.youtube}
                        onChange={(e) => handleInputChange('youtube', e.target.value)}
                        placeholder="channel"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Speichere...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Änderungen speichern
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account-Einstellungen</CardTitle>
              <CardDescription>Verwalte deine Account-Sicherheit und Einstellungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>E-Mail-Adresse</Label>
                <Input type="email" value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  Deine E-Mail-Adresse wird für Login und Benachrichtigungen verwendet
                </p>
              </div>

              <Separator />

              {/* Password Change Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Passwort ändern</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Neues Passwort</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mindestens 8 Zeichen, mit Groß- und Kleinbuchstaben
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (passwordData.newPassword !== passwordData.confirmPassword) {
                        setError('Passwörter stimmen nicht überein');
                        return;
                      }
                      if (passwordData.newPassword.length < 8) {
                        setError('Passwort muss mindestens 8 Zeichen lang sein');
                        return;
                      }

                      setIsLoading(true);
                      setError('');
                      setMessage('');

                      try {
                        const response = await fetch('/api/profile/change-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            currentPassword: passwordData.currentPassword,
                            newPassword: passwordData.newPassword,
                          }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          setMessage('Passwort erfolgreich geändert');
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                        } else {
                          setError(data.error || 'Fehler beim Ändern des Passworts');
                        }
                      } catch (error) {
                        setError('Ein unerwarteter Fehler ist aufgetreten');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={
                      isLoading ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ändere Passwort...
                      </>
                    ) : (
                      'Passwort ändern'
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold text-destructive mb-4">Gefahrenzone</h3>
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Account löschen</CardTitle>
                    <CardDescription>
                      Lösche deinen Account und alle zugehörigen Daten dauerhaft
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Lösche...
                        </>
                      ) : (
                        'Account löschen'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Darstellungseinstellungen</CardTitle>
              <CardDescription>
                Passe das Aussehen der Anwendung an deine Vorlieben an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Design</Label>
                <RadioGroup value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem value="light" id="light" />
                    <Label
                      htmlFor="light"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Sun className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Hell</div>
                        <div className="text-sm text-muted-foreground">
                          Helles Design für die Nutzung am Tag
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Moon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Dunkel</div>
                        <div className="text-sm text-muted-foreground">
                          Augenschonend für die Nutzung bei Nacht
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem value="system" id="system" />
                    <Label
                      htmlFor="system"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Monitor className="h-4 w-4" />
                      <div>
                        <div className="font-medium">System</div>
                        <div className="text-sm text-muted-foreground">
                          Automatisch an Systemeinstellungen anpassen
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Abo-Verwaltung</CardTitle>
              <CardDescription>
                Verwalte dein FluxAO Abonnement und Premium-Features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
                <h3 className="text-xl font-bold mb-2">FluxAO Free</h3>
                <p className="mb-4">Du nutzt aktuell die kostenlose Version von FluxAO</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span>✓</span> Zugriff auf alle öffentlichen Artikel
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> Newsletter-Empfang
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> Kommentarfunktion
                  </li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Upgrade zu Premium</h3>
                <div className="grid gap-4">
                  <Card className="border-purple-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-purple-600">FluxAO Premium</CardTitle>
                          <CardDescription>Für Tech-Enthusiasten und Professionals</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">4,99€</p>
                          <p className="text-sm text-muted-foreground">pro Monat</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span> Alle Free-Features
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span> Exklusive Premium-Artikel
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span> KI-Tools und Analysen
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span> Keine Werbung
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span> Früher Zugriff auf neue Features
                        </li>
                      </ul>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Jetzt upgraden
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>* Alle Preise verstehen sich inklusive MwSt.</p>
                <p>* Jederzeit kündbar zum Ende des Abrechnungszeitraums</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          {/* Phase 1: Newsletter + Benachrichtigungen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Newsletter & Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Verwalte deine E-Mail-Präferenzen und Benachrichtigungseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">E-Mail-Benachrichtigungen</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Newsletter abonnieren</Label>
                      <p className="text-sm text-muted-foreground">
                        Wöchentliche Updates mit den neuesten Artikeln und Tech-News
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.newsletterSubscription}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('newsletterSubscription', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Artikel-Benachrichtigungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Benachrichtigungen über neue Artikel in deinen Interessensgebieten
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.articleNotifications}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('articleNotifications', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Wöchentliche Zusammenfassung</Label>
                      <p className="text-sm text-muted-foreground">
                        Eine Übersicht der besten Artikel der Woche
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.weeklyDigest}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('weeklyDigest', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Kommentar-Benachrichtigungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Benachrichtigungen über Antworten auf deine Kommentare
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.commentNotifications}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('commentNotifications', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Erwähnungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Benachrichtigungen wenn du in Kommentaren erwähnt wirst
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.mentionNotifications}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('mentionNotifications', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Sicherheits-Benachrichtigungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Wichtige Sicherheitsmeldungen und Account-Updates
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.securityNotifications}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('securityNotifications', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Newsletter Frequency */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Newsletter-Häufigkeit</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Versandfrequenz</Label>
                    <Select
                      value={privacySettings.newsletterFrequency}
                      onValueChange={(value) => 
                        handlePrivacySettingChange('newsletterFrequency', value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Wöchentlich</SelectItem>
                        <SelectItem value="biweekly">Alle zwei Wochen</SelectItem>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-day">Zustellungstag</Label>
                    <Select
                      value={privacySettings.digestDeliveryDay}
                      onValueChange={(value) => 
                        handlePrivacySettingChange('digestDeliveryDay', value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Montag</SelectItem>
                        <SelectItem value="tuesday">Dienstag</SelectItem>
                        <SelectItem value="wednesday">Mittwoch</SelectItem>
                        <SelectItem value="thursday">Donnerstag</SelectItem>
                        <SelectItem value="friday">Freitag</SelectItem>
                        <SelectItem value="saturday">Samstag</SelectItem>
                        <SelectItem value="sunday">Sonntag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Topics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Benachrichtigungs-Themen</h4>
                <p className="text-sm text-muted-foreground">
                  Wähle die Themen aus, über die du benachrichtigt werden möchtest
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['AI', 'Tech', 'Programming', 'Startups', 'Web3', 'Security', 'Data Science', 'DevOps'].map((topic) => (
                    <div key={topic} className="flex items-center space-x-2">
                      <Switch
                        id={`topic-${topic.toLowerCase()}`}
                        checked={privacySettings.notificationTopics.includes(topic.toLowerCase())}
                        onCheckedChange={() => handleTopicToggle(topic.toLowerCase())}
                      />
                      <Label htmlFor={`topic-${topic.toLowerCase()}`} className="text-sm">
                        {topic}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePrivacySettings} disabled={isSaving}>
                  {isSaving ? (
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
            </CardContent>
          </Card>

          {/* Phase 2: Profile Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Profil-Sichtbarkeit
              </CardTitle>
              <CardDescription>
                Kontrolliere, wer deine Profil-Informationen sehen kann
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profil-Sichtbarkeit</Label>
                  <RadioGroup
                    value={privacySettings.profileVisibilityLevel}
                    onValueChange={(value) => 
                      handlePrivacySettingChange('profileVisibilityLevel', value as any)
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="profile-public" />
                      <Label htmlFor="profile-public">
                        <div className="font-medium">Öffentlich</div>
                        <div className="text-sm text-muted-foreground">
                          Jeder kann dein Profil sehen
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="followers" id="profile-followers" />
                      <Label htmlFor="profile-followers">
                        <div className="font-medium">Nur Follower</div>
                        <div className="text-sm text-muted-foreground">
                          Nur Benutzer, die dir folgen, können dein Profil sehen
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="profile-private" />
                      <Label htmlFor="profile-private">
                        <div className="font-medium">Privat</div>
                        <div className="text-sm text-muted-foreground">
                          Nur du kannst dein Profil sehen
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Kommentar-Anzeigename</Label>
                  <RadioGroup
                    value={privacySettings.commentDisplayName}
                    onValueChange={(value) => 
                      handlePrivacySettingChange('commentDisplayName', value as any)
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full_name" id="name-full" />
                      <Label htmlFor="name-full">Vollständiger Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="username" id="name-username" />
                      <Label htmlFor="name-username">Benutzername</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anonymous" id="name-anonymous" />
                      <Label htmlFor="name-anonymous">Anonym</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Avatar-Sichtbarkeit</Label>
                  <RadioGroup
                    value={privacySettings.avatarVisibility}
                    onValueChange={(value) => 
                      handlePrivacySettingChange('avatarVisibility', value as any)
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="avatar-public" />
                      <Label htmlFor="avatar-public">Öffentlich</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="followers" id="avatar-followers" />
                      <Label htmlFor="avatar-followers">Nur Follower</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="avatar-private" />
                      <Label htmlFor="avatar-private">Privat</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePrivacySettings} disabled={isSaving}>
                  {isSaving ? (
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
            </CardContent>
          </Card>

          {/* Phase 3: GDPR Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                DSGVO-Compliance
              </CardTitle>
              <CardDescription>
                Verwalte deine Daten und Privatsphäre gemäß DSGVO-Bestimmungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Analytics Opt-out */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Analytics deaktivieren</Label>
                  <p className="text-sm text-muted-foreground">
                    Opt-out aus der Nutzungsanalyse und Tracking
                  </p>
                </div>
                <Switch
                  checked={privacySettings.analyticsOptOut}
                  onCheckedChange={(checked) => 
                    handlePrivacySettingChange('analyticsOptOut', checked)
                  }
                />
              </div>

              <Separator />

              {/* Cookie Preferences */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  Cookie-Präferenzen
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Essentielle Cookies</Label>
                      <p className="text-sm text-muted-foreground">
                        Erforderlich für grundlegende Website-Funktionen
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.cookiePreferences.essential}
                      disabled={true} // Essential cookies cannot be disabled
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Analyse-Cookies</Label>
                      <p className="text-sm text-muted-foreground">
                        Helfen uns zu verstehen, wie die Website genutzt wird
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.cookiePreferences.analytics}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('cookiePreferences', {
                          ...privacySettings.cookiePreferences,
                          analytics: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Marketing-Cookies</Label>
                      <p className="text-sm text-muted-foreground">
                        Werden für personalisierte Werbung verwendet
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.cookiePreferences.marketing}
                      onCheckedChange={(checked) => 
                        handlePrivacySettingChange('cookiePreferences', {
                          ...privacySettings.cookiePreferences,
                          marketing: checked
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Export */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Datenexport
                </h4>
                <p className="text-sm text-muted-foreground">
                  Lade alle deine gespeicherten Daten als JSON-Datei herunter
                </p>
                
                {dataExportStatus.lastDeliveredAt && (
                  <p className="text-sm text-green-600">
                    Letzter Export: {new Date(dataExportStatus.lastDeliveredAt).toLocaleDateString('de-DE')}
                  </p>
                )}
                
                <Button
                  variant="outline"
                  onClick={requestDataExport}
                  disabled={!dataExportStatus.canRequest || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportiere...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Daten exportieren
                    </>
                  )}
                </Button>
                
                {!dataExportStatus.canRequest && (
                  <p className="text-sm text-muted-foreground">
                    Export ist einmal alle 24 Stunden möglich
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={savePrivacySettings} disabled={isSaving}>
                  {isSaving ? (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
