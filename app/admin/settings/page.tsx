'use client';

import { Settings, Mail, Shield, Save, Activity, Search, HardDrive } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General
    siteName: 'FluxAO',
    siteUrl: 'https://fluxao.de',
    adminEmail: 'admin@fluxao.de',
    timezone: 'Europe/Berlin',
    description: 'Magazin für KI, Gesellschaft & Zukunft',

    // Email/SMTP
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: 'noreply@fluxao.de',
    fromName: 'FluxAO',

    // Content
    postsPerPage: 12,
    commentMode: 'moderated',
    enableNewsletter: true,
    enableSharing: true,
    enableFlux: true,
    maintenanceMode: false,

    // SEO
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    enableSitemap: true,
    enableRobots: true,
    googleAnalytics: '',

    // Security
    enableCaptcha: false,
    captchaKey: '',
    enableRateLimit: true,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    sessionTimeout: 30,

    // Backup
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    backupLocation: 'local',

    // Cache
    enableCache: true,
    cacheDriver: 'redis',
    cacheTTL: 3600,

    // API
    enableAPI: false,
    apiRateLimit: 100,
    apiKey: '',

    // CDN
    enableCDN: false,
    cdnUrl: '',
    cdnKey: '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'Einstellungen gespeichert',
          description: 'Die Systemeinstellungen wurden erfolgreich aktualisiert.',
        });
      } else {
        throw new Error('Speichern fehlgeschlagen');
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Einstellungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  const testEmail = async () => {
    try {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: {
            host: settings.smtpHost,
            port: settings.smtpPort,
            user: settings.smtpUser,
            password: settings.smtpPassword,
            secure: settings.smtpSecure,
          },
          to: settings.adminEmail,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Test-Email gesendet',
          description: `Eine Test-Email wurde an ${settings.adminEmail} gesendet.`,
        });
      } else {
        throw new Error('Email-Test fehlgeschlagen');
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Test-Email konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">System-Einstellungen</h1>

      {/* General Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Allgemeine Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Website Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Admin Email</label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zeitzone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              >
                <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email/SMTP Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>E-Mail / SMTP Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              SMTP-Einstellungen sind erforderlich für: Registrierungsbestätigungen, Passwort-Reset,
              Newsletter-Versand
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SMTP Server*</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SMTP Port*</label>
              <input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SMTP Benutzername*</label>
              <input
                type="text"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SMTP Passwort*</label>
              <input
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Absender E-Mail</label>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Absender Name</label>
              <input
                type="text"
                value={settings.fromName}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtp-ssl"
              checked={settings.smtpSecure}
              onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="smtp-ssl" className="text-sm">
              SSL/TLS verwenden
            </label>
          </div>
          <button
            onClick={testEmail}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Test-Email senden
          </button>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Search className="h-5 w-5" />
          <CardTitle>SEO Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title (Standard)</label>
            <input
              type="text"
              value={settings.metaTitle}
              onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
              placeholder="FluxAO - Magazin für KI & Zukunft"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea
              rows={2}
              value={settings.metaDescription}
              onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
              placeholder="Entdecken Sie die neuesten Entwicklungen in KI..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Google Analytics ID</label>
            <input
              type="text"
              value={settings.googleAnalytics}
              onChange={(e) => setSettings({ ...settings, googleAnalytics: e.target.value })}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableSitemap}
                onChange={(e) => setSettings({ ...settings, enableSitemap: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Sitemap.xml generieren</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableRobots}
                onChange={(e) => setSettings({ ...settings, enableRobots: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Robots.txt aktivieren</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Sicherheit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max. Login-Versuche</label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) =>
                  setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Session Timeout (Minuten)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableRateLimit}
                onChange={(e) => setSettings({ ...settings, enableRateLimit: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Rate Limiting aktivieren (DDoS-Schutz)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableTwoFactor}
                onChange={(e) => setSettings({ ...settings, enableTwoFactor: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Zwei-Faktor-Authentifizierung für Admins</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableCaptcha}
                onChange={(e) => setSettings({ ...settings, enableCaptcha: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">CAPTCHA für Registrierung/Kommentare</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <HardDrive className="h-5 w-5" />
          <CardTitle>Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Backup-Häufigkeit</label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              >
                <option value="hourly">Stündlich</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Aufbewahrung (Tage)</label>
              <input
                type="number"
                value={settings.backupRetention}
                onChange={(e) =>
                  setSettings({ ...settings, backupRetention: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Automatische Backups aktivieren</span>
          </label>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Backup jetzt erstellen
          </button>
        </CardContent>
      </Card>

      {/* Cache Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>Cache & Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cache-Driver</label>
              <select
                value={settings.cacheDriver}
                onChange={(e) => setSettings({ ...settings, cacheDriver: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              >
                <option value="redis">Redis</option>
                <option value="memcached">Memcached</option>
                <option value="file">Datei-System</option>
                <option value="none">Kein Cache</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cache TTL (Sekunden)</label>
              <input
                type="number"
                value={settings.cacheTTL}
                onChange={(e) => setSettings({ ...settings, cacheTTL: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enableCache}
              onChange={(e) => setSettings({ ...settings, enableCache: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Cache aktivieren</span>
          </label>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Cache leeren
          </button>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Wartungsmodus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              Im Wartungsmodus können nur Administratoren auf die Website zugreifen.
            </p>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium">Wartungsmodus aktivieren</span>
          </label>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 sticky bottom-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
        </button>
      </div>
    </div>
  );
}
