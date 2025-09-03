'use client';

import { 
  LayoutDashboard, FileText, Users, Mail, BarChart3, Settings, 
  Quote, MessageSquare, Shield, Database, Flag, DollarSign,
  TrendingUp, Tags, ChevronLeft, ChevronRight, PenTool, Search, Folder,
  ExternalLink, Bell, User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Professional navigation structure with groups
const navigationSections = [
  {
    title: 'Hauptbereich',
    items: [
      { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard', badge: null },
      { name: 'Beiträge', href: '/admin/posts', icon: 'FileText', badge: null },
      { name: 'Schreiber', href: '/admin/writer', icon: 'PenTool', badge: null },
    ]
  },
  {
    title: 'Content & SEO',
    items: [
      { name: 'SEO', href: '/admin/seo', icon: 'Search', badge: null },
      { name: 'Kategorien', href: '/admin/categories', icon: 'Folder', badge: null },
      { name: 'Tags', href: '/admin/tags', icon: 'Tags', badge: null },
      { name: 'Zitate', href: '/admin/quotes', icon: 'Quote', badge: null },
    ]
  },
  {
    title: 'Community',
    items: [
      { name: 'Benutzer', href: '/admin/users', icon: 'Users', badge: null },
      { name: 'Newsletter', href: '/admin/newsletter', icon: 'Mail', badge: null },
    ]
  },
  {
    title: 'Analytics & Business',
    items: [
      { name: 'Analytics', href: '/admin/analytics', icon: 'BarChart3', badge: null },
      { name: 'Umsatz', href: '/admin/revenue', icon: 'DollarSign', badge: null },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Sicherheit', href: '/admin/security', icon: 'Shield', badge: null },
      { name: 'Cache', href: '/admin/cache', icon: 'Database', badge: null },
      { name: 'Flags', href: '/admin/flags', icon: 'Flag', badge: null },
      { name: 'Einstellungen', href: '/admin/settings', icon: 'Settings', badge: null },
    ]
  }
];

// Icon mapping function to convert string to component
const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    LayoutDashboard,
    FileText,
    PenTool,
    Search,
    Folder,
    Quote,
    MessageSquare,
    Users,
    Mail,
    Tags,
    BarChart3,
    DollarSign,
    Shield,
    Database,
    Flag,
    Settings,
  };
  return icons[iconName];
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-30 h-full bg-slate-900 border-r border-slate-700/50 transition-all duration-300 shadow-xl',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex h-full flex-col">
        {/* Modern Header with Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">FluxAO</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? 
              <ChevronRight className="w-4 h-4" /> : 
              <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Live Notifications - Top Priority */}
        {!collapsed && (
          <div className="px-3 py-4 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Benachrichtigungen</h3>
            </div>
            <div className="space-y-2">
              {/* Pending Comments */}
              <Link href="/admin/comments" className="flex items-center justify-between p-2 bg-amber-900/20 border border-amber-600/30 rounded-lg hover:bg-amber-900/30 transition-colors">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-amber-300">Kommentare moderieren</span>
                </div>
                <Badge className="bg-amber-600 text-white text-xs px-1 py-0">3</Badge>
              </Link>
              
              {/* System Status */}
              <Link href="/admin/security" className="flex items-center justify-between p-2 bg-green-900/20 border border-green-600/30 rounded-lg hover:bg-green-900/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-300">System OK</span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
          <div className="space-y-6">
            {navigationSections.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <h3 className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = getIcon(item.icon);
                    const isActive = pathname === item.href || 
                      (item.href !== '/admin' && pathname.startsWith(item.href));
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium relative',
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className={cn(
                          "w-5 h-5 flex-shrink-0 transition-colors",
                          isActive 
                            ? "text-white" 
                            : "text-slate-400 group-hover:text-white"
                        )} />
                        
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <Badge 
                                variant="destructive" 
                                className="ml-auto px-1.5 py-0.5 text-xs h-5 min-w-[20px] bg-red-500 hover:bg-red-500"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Modern Footer with User Section */}
        <div className="border-t border-slate-700/50 p-4 space-y-3">
          
          {/* Website Link */}
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-slate-800',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'View Website' : undefined}
          >
            <ExternalLink className="w-4 h-4" />
            {!collapsed && <span>Website anzeigen</span>}
          </Link>

        </div>
      </div>
    </aside>
  );
}