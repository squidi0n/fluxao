import { FileText, Users, Mail, Eye, Plus, BarChart3, Zap } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

// Icon mapping for the component
const iconMap = {
  FileText,
  Users,
  Mail,
  Eye,
  Plus,
  BarChart3,
  Zap
};

type IconName = keyof typeof iconMap;

interface StreamlinedDashboardProps {
  stats: {
    totalPosts: number;
    publishedPosts: number;
    totalUsers: number;
    totalViews: number;
    verifiedSubscriberCount: number;
    weeklyPosts: number;
    todayUsers: number;
  };
}

// 🎯 MINIMAL DASHBOARD - Schlichtheit & Effizienz
export default function StreamlinedAdminDashboard({ stats }: StreamlinedDashboardProps) {
  
  // 📊 NUR 4 CORE METRICS - Kein Firlefanz
  const metrics = [
    { label: 'Posts', value: stats.publishedPosts, href: '/admin/posts', icon: 'FileText' as IconName },
    { label: 'Views', value: (stats.totalViews || 0).toLocaleString('de-DE'), href: '/admin/analytics', icon: 'Eye' as IconName },
    { label: 'Users', value: stats.totalUsers, href: '/admin/users', icon: 'Users' as IconName },
    { label: 'Newsletter', value: stats.verifiedSubscriberCount, href: '/admin/newsletter', icon: 'Mail' as IconName },
  ];

  // ⚡ 3 QUICK ACTIONS - Das Wichtigste + Keyboard Shortcuts
  const actions = [
    { title: 'New Post', href: '/admin/posts/new', icon: 'Plus' as IconName, color: 'bg-black text-white hover:bg-gray-800', shortcut: 'Ctrl+N' },
    { title: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' as IconName, color: 'border hover:bg-gray-50', shortcut: 'Ctrl+A' },
    { title: 'Users', href: '/admin/users', icon: 'Users' as IconName, color: 'border hover:bg-gray-50', shortcut: 'Ctrl+U' },
  ];

  return (
    <div className="space-y-8">
      {/* 🎯 MINIMAL HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">FluxAO Admin Overview</p>
      </div>

      {/* 📊 CORE METRICS - Simple Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = iconMap[metric.icon];
          return (
            <Link key={metric.label} href={metric.href}>
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="text-sm font-medium text-gray-600">{metric.label}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ⚡ QUICK ACTIONS - Efficient */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = iconMap[action.icon];
            return (
              <Link key={action.title} href={action.href}>
                <button className={`${action.color} w-full p-4 rounded-lg flex items-center justify-between text-sm font-medium transition-colors group`}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.shortcut}
                  </div>
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 🔧 SYSTEM STATUS - Minimal */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Database</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">Online</div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Performance</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">99% Uptime</div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Cache</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">Active</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ⚡ KEYBOARD SHORTCUTS HELP - Effizienz Tipp */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
          <div><kbd className="bg-white px-2 py-1 rounded border text-gray-800">Ctrl+D</kbd> Dashboard</div>
          <div><kbd className="bg-white px-2 py-1 rounded border text-gray-800">Ctrl+N</kbd> New Post</div>
          <div><kbd className="bg-white px-2 py-1 rounded border text-gray-800">Ctrl+U</kbd> Users</div>
          <div><kbd className="bg-white px-2 py-1 rounded border text-gray-800">Ctrl+A</kbd> Analytics</div>
          <div><kbd className="bg-white px-2 py-1 rounded border text-gray-800">Ctrl+K</kbd> Search</div>
        </div>
      </div>
    </div>
  );
}