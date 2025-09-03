'use client';

import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SecurityEvent {
  id: string;
  type: string;
  severity: string;
  message: string;
  email?: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    name: string | null;
    email: string;
  };
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  failedLogins24h: number;
  successfulLogins24h: number;
  totalUsers: number;
  activeUsers24h: number;
  systemStatus: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showFullKey, setShowFullKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes, keysRes] = await Promise.all([
        fetch('/api/admin/security/events?limit=20'),
        fetch('/api/admin/security/stats'),
        fetch('/api/admin/api-keys'),
      ]);

      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (keysRes.ok) setApiKeys(await keysRes.json());
    } catch (error) {
      // console.error('Error fetching security data:', error);
    }
    setLoading(false);
  };

  const createApiKey = async () => {
    if (!newApiKeyName) return;

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newApiKeyName }),
      });

      if (res.ok) {
        const newKey = await res.json();
        setApiKeys([newKey, ...apiKeys]);
        setNewApiKeyName('');
        setShowFullKey(newKey.id);
        alert(
          `API Key erstellt! Bitte speichern Sie diesen Key, er wird nur einmal angezeigt:\n\n${newKey.key}`,
        );
      }
    } catch (error) {
      // console.error('Error creating API key:', error);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Möchten Sie diesen API Key wirklich widerrufen?')) return;

    try {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== keyId));
      }
    } catch (error) {
      // console.error('Error revoking API key:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'error':
        return 'text-orange-600 bg-orange-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getEventIcon = (type: string) => {
    if (type.includes('failed')) return <XCircle className="w-4 h-4 text-red-600" />;
    if (type.includes('success')) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (type.includes('warning')) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <Shield className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return <div className="p-6">Lade Sicherheitsdaten...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <button
          onClick={fetchSecurityData}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Security Status */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className={
              stats.systemStatus === 'healthy'
                ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
            }
          >
            <CardHeader className="flex flex-row items-center gap-2">
              <CheckCircle
                className={`h-5 w-5 ${stats.systemStatus === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}
              />
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`${stats.systemStatus === 'healthy' ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'} font-medium`}
              >
                {stats.systemStatus === 'healthy'
                  ? 'Alle Systeme sicher'
                  : 'Warnung: Kritische Events'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.totalEvents} Events (7 Tage)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Login Aktivität (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{stats.successfulLogins24h} Erfolgreiche</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {stats.failedLogins24h} Fehlgeschlagen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{stats.totalUsers} Gesamt</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.activeUsers24h} Aktiv (24h)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Sicherheitsereignisse (Live)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500">Noch keine Events vorhanden</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.type)}
                    <div>
                      <p className="font-medium text-sm">{event.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {event.email && <span>{event.email}</span>}
                        {event.ipAddress && <span>• IP: {event.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(event.severity)}`}
                    >
                      {event.severity}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(event.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Keys</CardTitle>
          <div className="flex gap-2">
            <input
              type="text"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              placeholder="Key Name"
              className="px-3 py-1 border rounded-lg text-sm"
            />
            <button
              onClick={createApiKey}
              className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Neuer API Key
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Key</th>
                  <th className="text-left p-2">Erstellt</th>
                  <th className="text-left p-2">Zuletzt verwendet</th>
                  <th className="text-left p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 text-sm font-medium">{apiKey.name}</td>
                    <td className="p-2 text-sm font-mono">
                      {showFullKey === apiKey.id ? apiKey.key : apiKey.key}
                    </td>
                    <td className="p-2 text-sm">
                      {new Date(apiKey.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="p-2 text-sm">
                      {apiKey.lastUsed
                        ? formatDistanceToNow(new Date(apiKey.lastUsed), {
                            addSuffix: true,
                            locale: de,
                          })
                        : 'Nie'}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => revokeApiKey(apiKey.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Widerrufen
                      </button>
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Keine API Keys vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
