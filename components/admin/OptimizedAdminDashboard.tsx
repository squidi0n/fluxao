'use client';

import React from 'react';
import { 
  FileText, 
  Mail, 
  Activity, 
  TrendingUp,
  Users,
  Eye,
  ChevronRight,
  MoreHorizontal,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Icon mapping for the component
const iconMap = {
  FileText,
  Mail,
  Activity,
  TrendingUp,
  Users,
  Eye,
  ChevronRight,
  MoreHorizontal,
  MessageSquare
};

type IconName = keyof typeof iconMap;

// ✨ MINIMAL DESIGN SYSTEM - Schlichtheit & Effizienz
const minimalColors = {
  primary: '#1e293b',    // Slate-800 - Hauptelemente
  secondary: '#64748b',  // Slate-500 - Support
  accent: '#0ea5e9',     // Sky-500 - Actions
  success: '#22c55e',    // Green-500 - Positive
  warning: '#f59e0b',    // Amber-500 - Alerts
  background: '#f8fafc', // Slate-50 - Clean Background
  surface: '#ffffff',    // White - Cards
  border: '#e2e8f0',     // Slate-200 - Subtle Borders
  text: {
    primary: '#0f172a',   // Slate-900 - Main Text
    secondary: '#475569', // Slate-600 - Secondary Text
    muted: '#94a3b8'      // Slate-400 - Muted Text
  }
};

// 📊 OPTIMIZED STAT CARD - Fokus auf Klarheit
interface MinimalStatCardProps {
  title: string;
  value: string | number;
  icon: IconName;
  trend?: {
    value: string;
    positive: boolean;
  };
  href?: string;
  priority?: 'high' | 'medium' | 'low';
}

function MinimalStatCard({ 
  title, 
  value, 
  icon, 
  trend,
  href,
  priority = 'medium' 
}: MinimalStatCardProps) {
  const Icon = iconMap[icon];
  const Component = href ? Link : 'div';
  
  const priorityStyles = {
    high: 'border-l-4 border-l-accent bg-gradient-to-r from-sky-50/50 to-transparent',
    medium: 'border border-slate-200',
    low: 'border border-slate-100'
  };

  return (
    <Component href={href || ''}>
      <Card 
        className={`
          ${priorityStyles[priority]} 
          hover:shadow-md transition-all duration-200 cursor-pointer
          ${href ? 'hover:bg-slate-50' : ''}
        `}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-600 leading-none">{title}</h3>
                  {trend && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${
                      trend.positive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${trend.positive ? '' : 'rotate-180'}`} />
                      {trend.value}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
              </p>
            </div>
            {href && (
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </div>
        </CardContent>
      </Card>
    </Component>
  );
}

// 🎯 QUICK ACTIONS - Effizienz-orientiert
function QuickActionsToolbar() {
  const quickActions = [
    { label: 'Neuer Artikel', href: '/admin/posts/new', icon: 'FileText' as IconName, shortcut: '⌘N' },
    { label: 'Newsletter', href: '/admin/newsletter/create', icon: 'Mail' as IconName, shortcut: '⌘M' },
    { label: 'Analytics', href: '/admin/analytics', icon: 'Activity' as IconName, shortcut: '⌘A' },
  ];

  return (
    <div className="flex items-center gap-3">
      {quickActions.map((action) => {
        const Icon = iconMap[action.icon];
        return (
          <Link key={action.label} href={action.href}>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            <Icon className="w-4 h-4" />
            {action.label}
            <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
              {action.shortcut}
            </kbd>
          </Button>
        </Link>
      );
      })}
      
      <Button variant="ghost" size="sm" className="text-slate-600">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </div>
  );
}

// 📈 MAIN DASHBOARD - Minimal & Focused
interface OptimizedDashboardProps {
  stats: {
    publishedPosts: number;
    subscribers: number;
    monthlyViews: number;
    todayUsers: number;
    trends: {
      postsGrowth: string;
      subscriberGrowth: string; 
      viewsGrowth: string;
      usersGrowth: string;
    };
  };
}

export default function OptimizedAdminDashboard({ stats }: OptimizedDashboardProps) {
  return (
    <div className="space-y-8 max-w-7xl">
      {/* 🎯 HEADER - Clean & Functional */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Dashboard
          </h1>
          <p className="text-slate-600">
            Überblick über wichtige Kennzahlen und Quick Actions
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Alle Systeme Online
          </Badge>
          <QuickActionsToolbar />
        </div>
      </div>

      {/* 📊 TIER 1: KRITISCHE KPIs - Sofort erkennbar */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Hauptmetriken</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MinimalStatCard
            title="Veröffentlichte Artikel"
            value={stats.publishedPosts}
            icon="FileText"
            trend={{ value: stats.trends.postsGrowth, positive: true }}
            href="/admin/posts"
            priority="high"
          />
          
          <MinimalStatCard
            title="Newsletter Abonnenten"
            value={stats.subscribers}
            icon="Mail"
            trend={{ value: stats.trends.subscriberGrowth, positive: true }}
            href="/admin/newsletter"
            priority="high"
          />
          
          <MinimalStatCard
            title="Monatliche Aufrufe"
            value={stats.monthlyViews.toLocaleString('de-DE')}
            icon="Eye"
            trend={{ value: stats.trends.viewsGrowth, positive: true }}
            href="/admin/analytics"
            priority="high"
          />
          
          <MinimalStatCard
            title="Heute Online"
            value={stats.todayUsers}
            icon="Users"
            trend={{ value: stats.trends.usersGrowth, positive: true }}
            priority="medium"
          />
        </div>
      </div>

      {/* 📋 TIER 2: WEITERE METRIKEN - Progressive Disclosure */}
      <details className="group">
        <summary className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer hover:text-slate-900 transition-colors">
          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
          Weitere Metriken anzeigen
        </summary>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
          <MinimalStatCard
            title="Kommentare"
            value="247"
            icon="MessageSquare"
            priority="low"
          />
          <MinimalStatCard
            title="Performance"
            value="99.2%"
            icon="Activity"
            priority="low"
          />
          <MinimalStatCard
            title="Cache Hit Rate"
            value="94.5%"
            icon="TrendingUp"
            priority="low"
          />
        </div>
      </details>

      {/* ⚡ TIER 3: QUICK WORKFLOWS - Häufige Aktionen */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Häufige Aktionen</h3>
            <Button variant="ghost" size="sm" className="text-slate-600">
              Anpassen
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              href="/admin/posts/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
            >
              <FileText className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
              <div>
                <h4 className="font-medium text-slate-900">Artikel schreiben</h4>
                <p className="text-sm text-slate-600">Neuen Content erstellen</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-slate-600" />
            </Link>
            
            <Link 
              href="/admin/newsletter/create"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
            >
              <Mail className="w-5 h-5 text-slate-600 group-hover:text-purple-600" />
              <div>
                <h4 className="font-medium text-slate-900">Newsletter senden</h4>
                <p className="text-sm text-slate-600">Kampagne erstellen</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-slate-600" />
            </Link>
            
            <Link 
              href="/admin/analytics"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
            >
              <Activity className="w-5 h-5 text-slate-600 group-hover:text-green-600" />
              <div>
                <h4 className="font-medium text-slate-900">Analytics prüfen</h4>
                <p className="text-sm text-slate-600">Performance analysieren</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-slate-600" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}