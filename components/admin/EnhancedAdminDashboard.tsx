'use client';

import { 
  FileText, 
  Users, 
  Mail, 
  Eye, 
  Plus, 
  BarChart3, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  MessageSquare,
  UserPlus,
  Globe,
  Shield,
  DollarSign,
  TrendingUp,
  Clock,
  Database,
  Server,
  AlertCircle,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Icon mapping for the component
const iconMap = {
  FileText,
  Users,
  Mail,
  Eye,
  Plus,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  MessageSquare,
  UserPlus,
  Globe,
  Shield,
  DollarSign,
  TrendingUp,
  Clock,
  Database,
  Server,
  AlertCircle,
  Settings
};

type IconName = keyof typeof iconMap;

interface EnhancedDashboardProps {
  stats: {
    // Core metrics
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalUsers: number;
    totalViews: number;
    verifiedSubscriberCount: number;
    pendingSubscribers: number;
    weeklyPosts: number;
    todayUsers: number;
    todayPosts: number;
    totalComments: number;
    pendingComments: number;
    
    // System health
    dbStatus: string;
    systemAlerts: number;
    aiUsageToday: number;
    recentSecurityEvents: number;
    activeUserSessions: number;
    
    // Business metrics
    totalNewsletterSent: number;
    supportTicketsOpen: number;
    subscriptionsActive: number;
    revenueThisMonth: number;
    
    // Trends
    trends: {
      viewsGrowth: string;
      userGrowth: string;
      subscriberGrowth: string;
      commentsGrowth: string;
    };
  };
}

export default function EnhancedAdminDashboard({ stats }: EnhancedDashboardProps) {
  
  // System Health Status with modern styling
  const systemHealth = [
    { 
      label: 'Datenbank', 
      status: stats.dbStatus, 
      color: stats.dbStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-red-500',
      textColor: stats.dbStatus === 'ONLINE' ? 'text-emerald-700' : 'text-red-700',
      bgColor: stats.dbStatus === 'ONLINE' ? 'bg-emerald-50' : 'bg-red-50',
      href: '/admin/performance'
    },
    { 
      label: 'Server', 
      status: 'ONLINE', 
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      href: '/admin/performance'
    },
    { 
      label: 'Aktive Sitzungen', 
      status: `${stats.activeUserSessions}`, 
      color: stats.activeUserSessions > 0 ? 'bg-blue-500' : 'bg-slate-400',
      textColor: stats.activeUserSessions > 0 ? 'text-blue-700' : 'text-slate-600',
      bgColor: stats.activeUserSessions > 0 ? 'bg-blue-50' : 'bg-slate-50',
      href: '/admin/users'
    }
  ];

  // Core Business Metrics with enhanced styling
  const coreMetrics = [
    { 
      label: 'Veröffentlichte Beiträge', 
      value: stats.publishedPosts,
      subValue: `+${stats.todayPosts} heute`,
      trend: stats.trends.viewsGrowth,
      href: '/admin/posts', 
      icon: 'FileText' as IconName,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      label: 'Gesamtaufrufe', 
      value: (stats.totalViews || 0).toLocaleString('de-DE'),
      subValue: 'Gesamt',
      trend: stats.trends.viewsGrowth,
      href: '/admin/analytics', 
      icon: 'Eye' as IconName,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    { 
      label: 'Verifizierte Abonnenten', 
      value: stats.verifiedSubscriberCount,
      subValue: `+${stats.pendingSubscribers} ausstehend`,
      trend: stats.trends.subscriberGrowth,
      href: '/admin/newsletter', 
      icon: 'Mail' as IconName,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      label: 'Benutzer gesamt', 
      value: stats.totalUsers,
      subValue: `${stats.todayUsers} heute aktiv`,
      trend: stats.trends.userGrowth,
      href: '/admin/users', 
      icon: 'Users' as IconName,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ];

  // Modern Quick Actions
  const quickActions = [
    { 
      title: 'Neuer Beitrag', 
      href: '/admin/posts/new', 
      icon: 'Plus' as IconName, 
      color: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
      description: 'Neuen Artikel erstellen',
      priority: true
    },
    { 
      title: 'Kommentare moderieren', 
      href: '/admin/comments', 
      icon: 'MessageSquare' as IconName, 
      color: 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300',
      description: `${stats.pendingComments} ausstehend`,
      badge: stats.pendingComments > 0 ? stats.pendingComments : undefined,
      priority: stats.pendingComments > 0
    },
    { 
      title: 'Newsletter senden', 
      href: '/admin/newsletter', 
      icon: 'Mail' as IconName, 
      color: 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300',
      description: `${stats.verifiedSubscriberCount} Abonnenten`,
      priority: false
    },
    { 
      title: 'Analytics anzeigen', 
      href: '/admin/analytics', 
      icon: 'BarChart3' as IconName, 
      color: 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300',
      description: 'Leistungskennzahlen',
      priority: false
    }
  ];

  // System Alerts (Real alerts based on data)
  const alerts = [
    ...(stats.pendingComments > 0 ? [{
      type: 'warning' as const,
      title: 'Kommentare warten auf Moderation',
      message: `${stats.pendingComments} Kommentare müssen überprüft werden`,
      href: '/admin/comments',
      action: 'Kommentare prüfen'
    }] : []),
    ...(stats.systemAlerts > 0 ? [{
      type: 'error' as const,
      title: 'Systemprobleme erkannt',
      message: `${stats.systemAlerts} ungelöste Warnmeldungen`,
      href: '/admin/performance',
      action: 'Details anzeigen'
    }] : []),
    ...(stats.draftPosts > 10 ? [{
      type: 'info' as const,
      title: 'Viele Entwürfe',
      message: `${stats.draftPosts} Beiträge sind noch Entwürfe`,
      href: '/admin/posts',
      action: 'Entwürfe überprüfen'
    }] : []),
    ...(stats.supportTicketsOpen > 0 ? [{
      type: 'warning' as const,
      title: 'Offene Support-Tickets',
      message: `${stats.supportTicketsOpen} Tickets benötigen Aufmerksamkeit`,
      href: '/admin/support',
      action: 'Tickets anzeigen'
    }] : []),
    ...(stats.recentSecurityEvents > 0 ? [{
      type: 'error' as const,
      title: 'Sicherheitsereignisse',
      message: `${stats.recentSecurityEvents} Ereignisse in den letzten 7 Tagen`,
      href: '/admin/security',
      action: 'Sicherheit überprüfen'
    }] : [])
  ];

  // Business Overview
  const businessMetrics = [
    {
      label: 'Umsatz (Monat)',
      value: `€${stats.revenueThisMonth.toFixed(2)}`,
      icon: 'DollarSign' as IconName,
      href: '/admin/revenue'
    },
    {
      label: 'Aktive Abonnements',
      value: stats.subscriptionsActive,
      icon: 'TrendingUp' as IconName,
      href: '/admin/users'
    },
    {
      label: 'Newsletter versendet',
      value: `${stats.totalNewsletterSent} (30d)`,
      icon: 'Mail' as IconName,
      href: '/admin/newsletter'
    },
    {
      label: 'KI-Aufgaben heute',
      value: stats.aiUsageToday,
      icon: 'Zap' as IconName,
      href: '/admin/ai'
    }
  ];

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen">
      {/* Modern Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-600 text-lg">FluxAO Admin - Echtzeit-Übersicht</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-300 hover:bg-slate-100" asChild>
            <Link href="/admin/settings">
              <Settings className="w-4 h-4 mr-2" />
              Einstellungen
            </Link>
          </Button>
        </div>
      </div>

      {/* System Health - Modern Design */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Systemzustand</h3>
              <p className="text-sm text-slate-600 mt-0.5">Alle kritischen Services</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {systemHealth.map((item) => (
              <Link key={item.label} href={item.href} className="block">
                <div className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${item.bgColor} border-transparent hover:border-slate-200`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}></div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className={`text-sm font-medium ${item.textColor}`}>{item.status}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Business Metrics - Enhanced Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {coreMetrics.map((metric) => {
          const Icon = iconMap[metric.icon];
          return (
            <Link key={metric.label} href={metric.href}>
              <Card className={`hover:shadow-lg transition-all duration-300 border-2 ${metric.borderColor} ${metric.bgColor} hover:scale-105`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${metric.bgColor} border-2 ${metric.borderColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <Badge 
                      variant={metric.trend.startsWith('+') ? 'default' : 'secondary'}
                      className={`${metric.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'} font-semibold`}
                    >
                      {metric.trend}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-slate-900 leading-none">
                      {metric.value}
                    </div>
                    <div className="text-sm font-medium text-slate-700">{metric.label}</div>
                    {metric.subValue && (
                      <div className="text-xs text-slate-500 bg-white/60 px-2 py-1 rounded-md inline-block">
                        {metric.subValue}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Alerts Section - Modern Alert Design */}
      {alerts.length > 0 && (
        <Card className="border-none shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-400">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Wichtige Benachrichtigungen</h3>
                <p className="text-sm text-amber-700 mt-0.5">{alerts.length} Aktionen erforderlich</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    alert.type === 'error' ? 'bg-red-50 border-red-200 hover:border-red-300' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200 hover:border-amber-300' :
                    'bg-blue-50 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      alert.type === 'error' ? 'bg-red-100' :
                      alert.type === 'warning' ? 'bg-amber-100' :
                      'bg-blue-100'
                    }`}>
                      {alert.type === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-base">{alert.title}</div>
                      <div className="text-sm text-slate-600 mt-1">{alert.message}</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`${
                      alert.type === 'error' ? 'border-red-300 text-red-700 hover:bg-red-100' :
                      alert.type === 'warning' ? 'border-amber-300 text-amber-700 hover:bg-amber-100' :
                      'border-blue-300 text-blue-700 hover:bg-blue-100'
                    } font-medium`}
                    asChild
                  >
                    <Link href={alert.href}>
                      {alert.action}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Modern Action Cards */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Schnellaktionen</h3>
              <p className="text-sm text-slate-600 mt-0.5">Häufig verwendete Funktionen</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = iconMap[action.icon];
              return (
                <Link key={action.title} href={action.href}>
                  <Card className={`border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${action.color} ${action.priority ? 'ring-2 ring-blue-200' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.priority ? 'bg-white/20' : 'bg-slate-100'}`}>
                          <Icon className={`w-5 h-5 ${action.priority ? 'text-white' : 'text-slate-600'}`} />
                        </div>
                        {action.badge && (
                          <Badge 
                            variant="destructive" 
                            className="bg-red-500 hover:bg-red-500 text-white font-semibold"
                          >
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className={`font-semibold text-base ${action.priority ? 'text-white' : 'text-slate-900'}`}>
                          {action.title}
                        </div>
                        <div className={`text-sm ${action.priority ? 'text-white/80' : 'text-slate-600'}`}>
                          {action.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Business Metrics - Enhanced Layout */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Geschäftsübersicht</h3>
              <p className="text-sm text-slate-600 mt-0.5">Wichtige Business-Metriken</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {businessMetrics.map((metric) => {
              const Icon = iconMap[metric.icon];
              return (
                <Link key={metric.label} href={metric.href}>
                  <div className="group p-5 rounded-xl bg-slate-50 border-2 border-slate-100 hover:border-slate-300 hover:bg-white transition-all duration-200 hover:shadow-md">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 mx-auto bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center group-hover:border-slate-300 transition-colors">
                        <Icon className="w-6 h-6 text-slate-600 group-hover:text-slate-700" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                        <div className="text-sm font-medium text-slate-600">{metric.label}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Success State - If no issues */}
      {alerts.length === 0 && (
        <Card className="border-none shadow-sm bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-l-emerald-400">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-emerald-900">Alle Systeme laufen einwandfrei</div>
                <div className="text-sm text-emerald-700 mt-1">Keine dringenden Probleme erkannt • System optimal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Footer */}
      <div className="flex items-center justify-between p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">
              Zuletzt aktualisiert: {new Date().toLocaleString('de-DE')}
            </div>
            <div className="text-xs text-slate-600">
              Alle Daten werden live aus der Datenbank geladen
            </div>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
          Echtzeit-Dashboard
        </Badge>
      </div>
    </div>
  );
}