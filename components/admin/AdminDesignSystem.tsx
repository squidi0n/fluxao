'use client';

import React from 'react';
import { 
  ChevronRight, Download, RefreshCw, Plus, TrendingUp, TrendingDown, Activity, BarChart3, Users, Eye, AlertCircle,
  FileText, Mail, MessageSquare, Shield, Zap, Server, Database, Globe, DollarSign, Calendar, Bell, Clock, Sparkles,
  UserPlus, CheckCircle, Edit, Archive, Star, Send, Target, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Icon mapping for server-to-client component communication
const iconMap = {
  FileText,
  Mail,
  MessageSquare,
  Shield,
  Zap,
  Server,
  Database,
  Globe,
  DollarSign,
  Calendar,
  Bell,
  Clock,
  Sparkles,
  Users,
  UserPlus,
  Eye,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Download,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Edit,
  Archive,
  Star,
  Send,
  Target,
  Layers
};

export type IconName = keyof typeof iconMap;

export function getIcon(iconName: IconName) {
  return iconMap[iconName];
}

// 🎨 ENHANCED UNIFIED DESIGN SYSTEM - Beautiful, Professional & Modern
export const adminColors = {
  // ✨ Primary - Deep Blue with warmth
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // 🌿 Success - Fresh, natural green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80', 
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // ⚡ Warning - Vibrant, attention-grabbing amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // 🔥 Danger - Modern red with elegance
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // 🔮 Purple - Creative and premium
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  // 💫 Indigo - Deep and trustworthy
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff', 
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  // 🌙 Gray - Sophisticated neutrals
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // 🏔️ Slate - Modern, clean alternative
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

// ✨ STUNNING GRADIENT COMBINATIONS - Premium & Modern
export const adminGradients = {
  primary: 'from-sky-500 via-sky-600 to-blue-600',
  primarySubtle: 'from-sky-50 via-blue-50 to-indigo-50',
  success: 'from-emerald-500 via-green-500 to-teal-600', 
  successSubtle: 'from-emerald-50 via-green-50 to-teal-50',
  warning: 'from-amber-400 via-orange-500 to-red-500',
  warningSubtle: 'from-amber-50 via-orange-50 to-red-50',
  danger: 'from-red-500 via-rose-500 to-pink-600',
  dangerSubtle: 'from-red-50 via-rose-50 to-pink-50',
  purple: 'from-purple-500 via-violet-500 to-indigo-600',
  purpleSubtle: 'from-purple-50 via-violet-50 to-indigo-50',
  indigo: 'from-indigo-500 via-blue-500 to-cyan-600',
  indigoSubtle: 'from-indigo-50 via-blue-50 to-cyan-50',
  dark: 'from-slate-800 via-gray-800 to-slate-900',
  darkSubtle: 'from-slate-50 via-gray-50 to-slate-100',
  // 🌅 Special atmospheric gradients
  sunrise: 'from-orange-400 via-pink-500 to-purple-600',
  ocean: 'from-blue-400 via-cyan-500 to-teal-600',
  forest: 'from-green-400 via-emerald-500 to-teal-600',
  sunset: 'from-pink-400 via-rose-500 to-red-600',
  royal: 'from-indigo-500 via-purple-500 to-pink-600',
  // 🏢 Professional glass effects
  glass: 'from-white/95 via-white/90 to-white/95',
  glassBlue: 'from-blue-500/10 via-sky-500/5 to-indigo-500/10',
  glassPurple: 'from-purple-500/10 via-violet-500/5 to-indigo-500/10'
};

// Enhanced Page Header Component
interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: IconName;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'live';
    pulse?: boolean;
  };
  actions?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: IconName;
  }>;
}

export function AdminPageHeader({ 
  title, 
  description, 
  icon, 
  badge,
  actions,
  breadcrumbs,
  stats 
}: PageHeaderProps) {
  const Icon = icon ? getIcon(icon) : null;
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
                {crumb.href ? (
                  <Link 
                    href={crumb.href}
                    className="hover:text-gray-700 transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-semibold">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {Icon && (
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              {badge && (
                <Badge 
                  variant="outline"
                  className={`
                    ${badge.variant === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${badge.variant === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                    ${badge.variant === 'danger' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    ${badge.variant === 'live' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    transition-all duration-200 font-semibold
                  `}
                >
                  {badge.variant === 'live' && badge.pulse && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  )}
                  {badge.text}
                </Badge>
              )}
            </div>
            
            {description && (
              <p className="text-gray-600 text-base leading-relaxed">{description}</p>
            )}
            
            {/* Quick Stats */}
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-6 mt-4 text-sm">
                {stats.map((stat, index) => {
                  const StatIcon = stat.icon ? getIcon(stat.icon) : null;
                  return (
                    <div key={index} className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                      {StatIcon && <StatIcon className="w-4 h-4" />}
                      <span className="font-medium">{stat.label}:</span>
                      <span className="font-bold text-gray-900">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Professional Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconName;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    percentage?: number;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'indigo';
  onClick?: () => void;
  href?: string;
  subtitle?: string;
  live?: boolean;
  loading?: boolean;
}

export function AdminStatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  color = 'blue',
  onClick,
  href,
  subtitle,
  live = false,
  loading = false
}: StatCardProps) {
  const Icon = getIcon(icon);
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50/80',
      border: 'border-sky-200/60',
      icon: 'text-sky-700',
      iconBg: 'bg-gradient-to-br from-sky-100 to-blue-100 shadow-sm',
      text: 'text-sky-600',
      hover: 'hover:shadow-sky-200/40 hover:border-sky-300/80'
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50/80',
      border: 'border-emerald-200/60', 
      icon: 'text-emerald-700',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-green-100 shadow-sm',
      text: 'text-emerald-600',
      hover: 'hover:shadow-emerald-200/40 hover:border-emerald-300/80'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-100/50',
      border: 'border-yellow-200/60',
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100', 
      text: 'text-yellow-600',
      hover: 'hover:shadow-yellow-100/50'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-100/50',
      border: 'border-red-200/60',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      text: 'text-red-600',
      hover: 'hover:shadow-red-100/50'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-violet-100/50',
      border: 'border-purple-200/60',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100',
      text: 'text-purple-600',
      hover: 'hover:shadow-purple-100/50'
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-blue-100/50',
      border: 'border-indigo-200/60',
      icon: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      text: 'text-indigo-600',
      hover: 'hover:shadow-indigo-100/50'
    },
    gray: {
      bg: 'bg-gradient-to-br from-gray-50 to-slate-100/50',
      border: 'border-gray-200/60',
      icon: 'text-gray-600',
      iconBg: 'bg-gray-100',
      text: 'text-gray-600',
      hover: 'hover:shadow-gray-100/50'
    }
  };

  const classes = colorClasses[color];
  const CardComponent = href ? Link : 'div';
  const cardProps = href ? { href } : { onClick };
  
  return (
    <CardComponent {...cardProps}>
      <Card 
        className={`${classes.bg} ${classes.border} ${classes.hover} transition-all duration-300 ${
          (onClick || href) ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-opacity-100' : ''
        } relative overflow-hidden group`}
      >
        {live && (
          <div className="absolute top-4 right-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <p className="text-overline text-gray-800">{label}</p>
                {live && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Live
                  </Badge>
                )}
              </div>
              
              <div className="flex items-baseline gap-3 mb-2">
                {loading ? (
                  <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="metric-value">
                    {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
                  </p>
                )}
                
                {trend && !loading && (
                  <div className={`flex items-center gap-1.5 text-sm font-bold px-2 py-1 rounded-lg ${ 
                    trend.direction === 'up' ? 'text-green-700 bg-green-100' :
                    trend.direction === 'down' ? 'text-red-700 bg-red-100' :
                    'text-gray-600 bg-gray-100'
                  }`}>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : trend.direction === 'down' ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    <span>{trend.value}</span>
                  </div>
                )}
              </div>
              
              {subtitle && (
                <p className="text-caption text-gray-700">{subtitle}</p>
              )}
            </div>
            
            <div className={`w-16 h-16 rounded-2xl ${classes.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <Icon className={`w-8 h-8 ${classes.icon}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  );
}

// Enhanced Quick Actions Component
interface QuickActionProps {
  title: string;
  description: string;
  icon: IconName;
  onClick?: () => void;
  href?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red';
  badge?: string;
}

export function AdminQuickAction({ 
  title, 
  description, 
  icon, 
  onClick, 
  href,
  color = 'blue',
  badge
}: QuickActionProps) {
  const Icon = getIcon(icon);
  const gradients = {
    blue: 'from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900',
    green: 'from-green-600 via-green-700 to-emerald-800 hover:from-green-700 hover:via-green-800 hover:to-emerald-900',
    purple: 'from-purple-600 via-purple-700 to-violet-800 hover:from-purple-700 hover:via-purple-800 hover:to-violet-900',
    orange: 'from-orange-600 via-orange-700 to-red-700 hover:from-orange-700 hover:via-orange-800 hover:to-red-800',
    indigo: 'from-indigo-600 via-indigo-700 to-blue-800 hover:from-indigo-700 hover:via-indigo-800 hover:to-blue-900',
    red: 'from-red-600 via-red-700 to-rose-800 hover:from-red-700 hover:via-red-800 hover:to-rose-900',
  };

  const Component = href ? Link : 'div';
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={`
        group bg-gradient-to-br ${gradients[color]} text-white rounded-2xl p-6 shadow-xl 
        hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer
        relative overflow-hidden
      `}
    >
      {badge && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/20 text-white border-white/30">
            {badge}
          </Badge>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-10 h-10 drop-shadow-sm" />
        <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90 leading-relaxed">{description}</p>
      
      {/* Decorative element */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    </Component>
  );
}

// Enhanced Section Container
interface AdminSectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminSection({ 
  title, 
  description, 
  actions, 
  children, 
  className = '' 
}: AdminSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between">
          <div>
            {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// Enhanced Loading States
export function AdminCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Action Buttons
interface AdminActionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AdminActionButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  loading = false,
  onClick,
  className = '' 
}: AdminActionButtonProps) {
  const Icon = icon ? getIcon(icon) : null;
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-md hover:shadow-lg',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={`
        ${variants[variant]} ${sizes[size]} 
        inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5
        ${className}
      `}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </Button>
  );
}

// Professional Dashboard Welcome Card
interface WelcomeCardProps {
  greeting: string;
  description: string;
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: IconName;
  }>;
}

export function AdminWelcomeCard({ greeting, description, stats }: WelcomeCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-0 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      
      <CardContent className="p-8 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
              {greeting} 👋
            </h1>
            <p className="text-blue-100 text-lg mb-6 leading-relaxed">
              {description}
            </p>
            
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-8 text-sm">
                {stats.map((stat, index) => {
                  const StatIcon = stat.icon ? getIcon(stat.icon) : null;
                  return (
                    <div key={index} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                      {StatIcon && <StatIcon className="w-4 h-4" />}
                      <span className="text-blue-100">{stat.label}:</span>
                      <span className="font-bold">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-100 border-blue-400/20 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Alle Systeme online
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export action buttons for common actions
export function CreateButton({ children, onClick, href }: { children: React.ReactNode, onClick?: () => void, href?: string }) {
  if (href) {
    return (
      <Link href={href}>
        <AdminActionButton variant="primary" icon="Plus">
          {children}
        </AdminActionButton>
      </Link>
    );
  }
  
  return (
    <AdminActionButton variant="primary" icon="Plus" onClick={onClick}>
      {children}
    </AdminActionButton>
  );
}

export function RefreshButton({ onClick, loading }: { onClick?: () => void, loading?: boolean }) {
  return (
    <AdminActionButton variant="secondary" icon="RefreshCw" loading={loading} onClick={onClick}>
      Aktualisieren
    </AdminActionButton>
  );
}

export function ExportButton({ onClick, loading }: { onClick?: () => void, loading?: boolean }) {
  return (
    <AdminActionButton variant="secondary" icon="Download" loading={loading} onClick={onClick}>
      Exportieren
    </AdminActionButton>
  );
}