'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Plus,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Eye,
  Mail,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// 🎯 MINIMAL NAVIGATION - Fokus auf häufigste Workflows
const primaryNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    badge: 'Live',
    badgeColor: 'green'
  },
  {
    name: 'Content',
    href: '/admin/posts',
    icon: FileText,
    description: 'Artikel & Posts',
    quickAction: { label: 'Neu', href: '/admin/posts/new', icon: Plus }
  },
  {
    name: 'Benutzer',
    href: '/admin/users',
    icon: Users,
    description: 'User Management'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Statistiken',
    badge: 'Live',
    badgeColor: 'blue'
  },
];

// 📂 ERWEITERTE NAVIGATION - On-Demand verfügbar
const secondaryNavigation = [
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { name: 'Einstellungen', href: '/admin/settings', icon: Settings },
  { name: 'Performance', href: '/admin/performance', icon: Zap },
];

interface OptimizedSidebarProps {
  className?: string;
}

export default function OptimizedAdminSidebar({ className = '' }: OptimizedSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  const getBadgeColor = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-30 h-full bg-white border-r border-slate-200 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-80'}
        ${className}
      `}
    >
      <div className="flex h-full flex-col">
        {/* 🎨 CLEAN HEADER - Minimal Branding */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
          {!collapsed && (
            <Link href="/admin" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">FluxAO</span>
                <span className="text-sm text-slate-500 block -mt-1">Admin</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-100"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            )}
          </Button>
        </div>

        {/* 🎯 PRIMARY NAVIGATION - Häufigste Workflows */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const QuickIcon = item.quickAction?.icon;

            return (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  
                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <Badge 
                              variant="outline"
                              className={`text-xs px-2 py-0 ${
                                active ? 'bg-white/20 text-white border-white/30' : getBadgeColor(item.badgeColor)
                              }`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* ⚡ QUICK ACTION - Direct Access */}
                      {item.quickAction && (
                        <Link
                          href={item.quickAction.href}
                          className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={item.quickAction.label}
                        >
                          {QuickIcon && <QuickIcon className="w-4 h-4 text-slate-600" />}
                        </Link>
                      )}
                    </>
                  )}
                </Link>
              </div>
            );
          })}

          {/* 📂 EXPANDED NAVIGATION Toggle */}
          {!collapsed && (
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setShowSecondary(!showSecondary)}
              className="w-full justify-start gap-3 px-3 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 mt-4"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="flex-1 text-left">
                {showSecondary ? 'Weniger anzeigen' : 'Weitere Bereiche'}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showSecondary ? 'rotate-90' : ''}`} />
            </Button>
          )}

          {/* 🔧 SECONDARY NAVIGATION - On-Demand */}
          {!collapsed && showSecondary && (
            <div className="space-y-1 pt-4 border-t border-slate-200 mt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Weitere Bereiche
              </h4>
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      ${active 
                        ? 'bg-slate-100 text-slate-900 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* 🏠 FOOTER - Simple & Clean */}
        <div className="border-t border-slate-200 p-4">
          <Link
            href="/"
            className={`
              flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 transition-colors rounded-lg p-2 hover:bg-slate-100
              ${collapsed ? 'justify-center' : ''}
            `}
            title="Website ansehen"
          >
            <Eye className="w-4 h-4" />
            {!collapsed && <span>Website ansehen</span>}
          </Link>
          
          {!collapsed && (
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 px-2">
              <span>Version 2.1.0</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}