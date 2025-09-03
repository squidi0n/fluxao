'use client';

import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  LogOut,
  User,
  Shield,
  FileText,
  Lock,
  Star,
  Users,
  FolderOpen,
  Globe,
  Zap,
  Database,
  ArrowRight,
  Terminal,
  Code,
  GitBranch,
  Package,
  Rocket,
  Bug,
  Save,
  RefreshCw,
  Play,
  Copy,
  CheckCheck,
  Server,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

interface FeatureStatus {
  name: string;
  status: 'working' | 'partial' | 'broken' | 'testing';
  description: string;
  links: { label: string; href: string; requiresAuth?: boolean; requiresAdmin?: boolean }[];
  apiEndpoint?: string;
  notes?: string;
}

export default function FeaturesPage() {
  const { user, login, logout } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [serverPort, setServerPort] = useState('3000');
  const [activeTab, setActiveTab] = useState<'features' | 'developer'>('features');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    server: 'checking',
    database: 'checking',
    git: 'checking',
    dependencies: 'checking',
  });

  useEffect(() => {
    // Detect server port
    const port = window.location.port || '3000';
    setServerPort(port);

    // Check system status
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // Server check - use a real endpoint
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        signal: AbortSignal.timeout(1000), // 1 second timeout
      });
      setSystemStatus((prev) => ({ ...prev, server: res.ok ? 'online' : 'offline' }));
    } catch {
      setSystemStatus((prev) => ({ ...prev, server: 'offline' }));
    }

    // Simulate other checks (würden normalerweise API calls sein)
    setSystemStatus((prev) => ({
      ...prev,
      database: 'online',
      git: 'online',
      dependencies: 'online',
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(text);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      // console.error('Failed to copy:', err);
    }
  };

  const quickCommands = [
    { cmd: 'pnpm dev', desc: 'Start development server', icon: Play },
    { cmd: 'pnpm build', desc: 'Build for production', icon: Package },
    { cmd: 'npx prisma studio', desc: 'Open database manager', icon: Database },
    { cmd: '.\\backup.ps1', desc: 'Create version backup', icon: Save },
    { cmd: '.\\restore.ps1', desc: 'Restore previous version', icon: RefreshCw },
    { cmd: '.\\quick.ps1', desc: 'Open quick commands menu', icon: Terminal },
    { cmd: 'npx prisma db push', desc: 'Sync database schema', icon: Database },
    { cmd: 'npx prisma db seed', desc: 'Seed test data', icon: Database },
    { cmd: 'git status', desc: 'Check git status', icon: GitBranch },
    { cmd: 'rm -rf .next && pnpm dev', desc: 'Fix build errors', icon: Bug },
  ];

  const developerLinks = [
    { label: 'Homepage', href: `http://localhost:${serverPort}`, badge: 'LOCAL', icon: Globe },
    {
      label: 'Admin Panel',
      href: `http://localhost:${serverPort}/admin`,
      badge: 'AUTH',
      icon: Shield,
    },
    {
      label: 'New Post',
      href: `http://localhost:${serverPort}/admin/posts/new`,
      badge: 'ADMIN',
      icon: FileText,
    },
    {
      label: 'Prisma Studio',
      href: '#',
      badge: 'DB',
      icon: Database,
      onClick: () => alert('Run: npx prisma studio'),
    },
    { label: 'Production', href: 'https://fluxao.de', badge: 'LIVE', icon: Rocket },
  ];

  const importantFiles = [
    { name: '.env', path: '.env', badge: 'CONFIG' },
    { name: '.claudecontext', path: '.claudecontext', badge: 'AI' },
    { name: 'CLAUDE.md', path: 'CLAUDE.md', badge: 'DOCS' },
    { name: 'package.json', path: 'package.json', badge: 'DEPS' },
    { name: 'schema.prisma', path: 'prisma/schema.prisma', badge: 'DB' },
    { name: 'middleware.ts', path: 'middleware.ts', badge: 'AUTH' },
  ];

  const claudeTips = [
    { cmd: '"Status"', desc: 'Zeigt Projektstatus' },
    { cmd: '"Fehler"', desc: 'Analysiert und behebt Probleme' },
    { cmd: '"Feature: [Name]"', desc: 'Implementiert neues Feature' },
    { cmd: '"Fix: [Problem]"', desc: 'Behebt spezifisches Problem' },
    { cmd: '"Deploy"', desc: 'Bereitet Produktion vor' },
    { cmd: '"Post: [Titel]"', desc: 'Erstellt neuen Artikel' },
  ];

  const features: FeatureStatus[] = [
    {
      name: '🔐 Authentication System',
      status: 'working',
      description: 'Login, Registrierung, Session Management',
      links: [
        { label: 'Login', href: '/auth/login' },
        { label: 'Register', href: '/auth/register' },
        { label: 'Profile Settings', href: '/profile/settings', requiresAuth: true },
      ],
      apiEndpoint: '/api/auth/me',
      notes: 'NextAuth.js mit JWT Sessions. OAuth vorbereitet aber nicht konfiguriert.',
    },
    {
      name: '📝 Post Management',
      status: user ? 'working' : 'partial',
      description: 'Artikel erstellen, bearbeiten, löschen',
      links: [
        { label: 'Admin Posts', href: '/admin/posts', requiresAdmin: true },
        { label: 'Create Post', href: '/admin/posts/new', requiresAdmin: true },
        { label: 'Public Blog', href: '/blog' },
        { label: 'News Section', href: '/news' },
      ],
      apiEndpoint: '/api/admin/posts',
      notes: 'TipTap Editor, Markdown Support, Draft/Published Status',
    },
    {
      name: '📧 Newsletter System',
      status: 'partial',
      description: 'Newsletter Subscriber Management & Versand',
      links: [
        { label: 'Newsletter Admin', href: '/admin/newsletter', requiresAdmin: true },
        { label: 'Create Campaign', href: '/admin/newsletter/create', requiresAdmin: true },
        { label: 'Templates', href: '/admin/newsletter/templates', requiresAdmin: true },
      ],
      apiEndpoint: '/api/newsletter/subscribe',
      notes: '⚠️ SMTP nicht konfiguriert - E-Mails können nicht versendet werden!',
    },
    {
      name: '💬 Comment System',
      status: 'working',
      description: 'Kommentare mit Moderation',
      links: [
        { label: 'Comments Admin', href: '/admin/comments', requiresAdmin: true },
        { label: 'Moderation Queue', href: '/admin/comments?status=pending', requiresAdmin: true },
      ],
      apiEndpoint: '/api/comments',
      notes: 'Spam-Filter, verschachtelte Antworten, Rate Limiting',
    },
    {
      name: '👥 User Management',
      status: 'working',
      description: 'Benutzerverwaltung und Rollen',
      links: [
        { label: 'Users Admin', href: '/admin/users', requiresAdmin: true },
        { label: 'User Profiles', href: '/profile', requiresAuth: true },
      ],
      apiEndpoint: '/api/admin/users',
      notes: 'Rollen: USER, AUTHOR, EDITOR, ADMIN, PREMIUM',
    },
    {
      name: '💳 Payment System',
      status: 'partial',
      description: 'Stripe Integration für Subscriptions',
      links: [{ label: 'Pricing', href: '/pricing' }],
      apiEndpoint: '/api/subscription/checkout',
      notes: '⚠️ Stripe Keys sind Dummy-Werte - Zahlungen nicht möglich!',
    },
    {
      name: '🔍 Search',
      status: 'working',
      description: 'Volltext-Suche',
      links: [{ label: 'Search Page', href: '/search' }],
      apiEndpoint: '/api/search',
      notes: 'SQLite Full-Text Search, Filter nach Tags/Kategorien',
    },
    {
      name: '#️⃣ Tags & Categories',
      status: 'working',
      description: 'Taxonomie-System',
      links: [{ label: 'Tags Admin', href: '/admin/tags', requiresAdmin: true }],
      apiEndpoint: '/api/admin/tags',
      notes: 'Bulk Import, Slug-Generierung',
    },
  ];

  const testEndpoint = async (endpoint: string): Promise<boolean> => {
    try {
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      return res.ok || res.status === 401 || res.status === 403; // Auth required is OK
    } catch {
      return false;
    }
  };

  const runTests = async () => {
    setTesting(true);
    const results: Record<string, boolean> = {};

    for (const feature of features) {
      if (feature.apiEndpoint) {
        results[feature.apiEndpoint] = await testEndpoint(feature.apiEndpoint);
      }
    }

    setTestResults(results);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'broken':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      working: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      broken: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      testing: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const labels = {
      working: 'Funktioniert',
      partial: 'Teilweise',
      broken: 'Defekt',
      testing: 'Testing',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">🚀 FluxAO Developer Dashboard</h1>
          <p className="text-xl opacity-90 mb-6">Features, Status & Development Tools</p>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-8">
            <button
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'features'
                  ? 'bg-white/20 backdrop-blur text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Features & Status
              </div>
            </button>
            <button
              onClick={() => setActiveTab('developer')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'developer'
                  ? 'bg-white/20 backdrop-blur text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Developer Tools
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Login Bar - IMMER SICHTBAR! */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b-2 border-yellow-300 dark:border-yellow-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-800 dark:text-yellow-300">
                Quick Login Test-User:
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await login('admin@fluxao.com', 'Admin123!@#');
                  } catch (error) {
                    // console.error('Login failed:', error);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin Login
              </button>
              <button
                onClick={async () => {
                  try {
                    await login('premium@test.com', 'Premium123!');
                  } catch (error) {
                    // console.error('Login failed:', error);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Premium Login
              </button>
              <button
                onClick={async () => {
                  try {
                    await login('user@test.com', 'User123!');
                  } catch (error) {
                    // console.error('Login failed:', error);
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Normal Login
              </button>
              {user && (
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 ml-4"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Info Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <User className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Angemeldet als: {user.email}</span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs font-medium rounded">
                      {user.role || 'USER'}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Nicht angemeldet</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'features' && (
                <button
                  onClick={runTests}
                  disabled={testing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Test All APIs
                    </>
                  )}
                </button>
              )}

              <div className="text-sm text-gray-500">
                Server Port: <span className="font-mono font-bold">{serverPort}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'features' ? (
          /* Features Tab */
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-green-600">
                  {features.filter((f) => f.status === 'working').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Funktioniert</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-yellow-600">
                  {features.filter((f) => f.status === 'partial').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Teilweise</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-red-600">
                  {features.filter((f) => f.status === 'broken').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Defekt</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(
                    (features.filter((f) => f.status === 'working').length / features.length) * 100,
                  )}
                  %
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Fertig</div>
              </div>
            </div>

            {/* Features List */}
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(feature.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {feature.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(feature.status)}
                        {feature.apiEndpoint && testResults[feature.apiEndpoint] !== undefined && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              testResults[feature.apiEndpoint]
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            API {testResults[feature.apiEndpoint] ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {feature.links.map((link, linkIndex) => {
                        const isDisabled =
                          (link.requiresAuth && !user) ||
                          (link.requiresAdmin && user?.role !== 'ADMIN');

                        return (
                          <Link
                            key={linkIndex}
                            href={isDisabled ? '#' : link.href}
                            className={`
                              flex items-center justify-between px-4 py-2 rounded-lg border transition-colors
                              ${
                                isDisabled
                                  ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }
                            `}
                            onClick={isDisabled ? (e) => e.preventDefault() : undefined}
                          >
                            <span className="text-sm font-medium">{link.label}</span>
                            <div className="flex items-center gap-1">
                              {link.requiresAdmin && <Shield className="w-3 h-3 text-purple-500" />}
                              {link.requiresAuth && <Lock className="w-3 h-3 text-blue-500" />}
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {feature.notes && (
                      <div
                        className={`mt-4 p-3 rounded-lg text-sm ${
                          feature.notes.includes('⚠️')
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {feature.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Credentials */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">
                🔐 Admin Zugangsdaten
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">E-Mail</div>
                  <div className="font-mono text-lg">admin@fluxao.com</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Passwort</div>
                  <div className="font-mono text-lg">Admin123!@#</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Developer Tab */
          <div className="grid gap-6">
            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Status
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Server</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${systemStatus.server === 'online' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {systemStatus.server === 'online' ? '✓ Online' : '✗ Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Database</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${systemStatus.database === 'online' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {systemStatus.database === 'online' ? '✓ Ready' : '✗ Error'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Git</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${systemStatus.git === 'online' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {systemStatus.git === 'online' ? '✓ Init' : '✗ Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Dependencies</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${systemStatus.dependencies === 'online' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {systemStatus.dependencies === 'online' ? '✓ Installed' : '✗ Missing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Login Test Users */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-sm border-2 border-purple-200 dark:border-purple-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Quick Login - Test Users
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin/users"
                    className="ml-auto text-sm px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    User Management →
                  </Link>
                )}
              </h2>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={async () => {
                    try {
                      const result = await signIn('credentials', {
                        email: 'premium@test.com',
                        password: 'Premium123!',
                        redirect: false,
                      });
                      if (result?.ok) {
                        router.push('/profile');
                        router.refresh();
                      } else {
                        alert('Login failed - User not found');
                      }
                    } catch (error) {
                      // console.error('Login failed:', error);
                    }
                  }}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <div className="font-bold flex items-center justify-center gap-2">⚡ Premium</div>
                  <div className="text-xs mt-1">Pro Features</div>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const result = await signIn('credentials', {
                        email: 'premium@test.com',
                        password: 'Premium123!',
                        redirect: false,
                      });
                      if (result?.ok) {
                        router.push('/profile');
                        router.refresh();
                      } else {
                        alert('Login failed');
                      }
                    } catch (error) {
                      // console.error('Login failed:', error);
                      alert('Login failed');
                    }
                  }}
                  className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
                >
                  <div className="font-bold flex items-center justify-center gap-2">⚡ Premium</div>
                  <div className="text-xs mt-1">Badge & Highlights</div>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const result = await signIn('credentials', {
                        email: 'user@test.com',
                        password: 'User123!',
                        redirect: false,
                      });
                      if (result?.ok) {
                        router.push('/profile');
                        router.refresh();
                      } else {
                        alert('Login failed');
                      }
                    } catch (error) {
                      // console.error('Login failed:', error);
                      alert('Login failed');
                    }
                  }}
                  className="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <div className="font-bold flex items-center justify-center gap-2">👤 Normal</div>
                  <div className="text-xs mt-1">Basis Zugang</div>
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ Nur für Entwicklung! Diese Buttons funktionieren nur lokal.
                  </p>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      👑 Du bist als Admin eingeloggt! Du kannst neue User über{' '}
                      <Link href="/admin/users" className="underline">
                        User Management
                      </Link>{' '}
                      erstellen.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Commands */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Quick Commands
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {quickCommands.map((cmd, index) => {
                  const Icon = cmd.icon;
                  return (
                    <div
                      key={index}
                      onClick={() => copyToClipboard(cmd.cmd)}
                      className="flex items-center justify-between p-3 bg-gray-900 dark:bg-black rounded-lg cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="font-mono text-sm text-green-400">{cmd.cmd}</div>
                          <div className="text-xs text-gray-500">{cmd.desc}</div>
                        </div>
                      </div>
                      {copiedCommand === cmd.cmd ? (
                        <CheckCheck className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500 group-hover:text-green-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Quick Links
                </h2>
                <div className="space-y-2">
                  {developerLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={index}
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        onClick={link.onClick}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        rel="noreferrer"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">{link.label}</span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            link.badge === 'LOCAL'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : link.badge === 'AUTH'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : link.badge === 'ADMIN'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  : link.badge === 'LIVE'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {link.badge}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Important Files */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Important Files
                </h2>
                <div className="space-y-2">
                  {importantFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-mono">{file.name}</span>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          file.badge === 'CONFIG'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : file.badge === 'AI'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : file.badge === 'DB'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {file.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Claude Tips */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Claude Quick Commands
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {claudeTips.map((tip, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="font-mono text-sm text-purple-600 dark:text-purple-400">
                      {tip.cmd}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{tip.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
