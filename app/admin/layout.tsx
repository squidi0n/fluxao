'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 🎯 KEYBOARD SHORTCUTS - Effizienz steigern
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // TODO: Open search
            console.log('Search shortcut');
            break;
          case 'n':
            e.preventDefault();
            window.location.href = '/admin/posts/new';
            break;
          case 'd':
            e.preventDefault();
            window.location.href = '/admin';
            break;
          case 'u':
            e.preventDefault();
            window.location.href = '/admin/users';
            break;
          case 'a':
            e.preventDefault();
            window.location.href = '/admin/analytics';
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🎯 SIMPLE PAGE TITLES - Kein Firlefanz
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname.startsWith('/admin/posts')) return 'Beiträge';
    if (pathname.startsWith('/admin/writer')) return 'Schreiber';
    if (pathname.startsWith('/admin/seo')) return 'SEO';
    if (pathname.startsWith('/admin/categories')) return 'Kategorien';
    if (pathname.startsWith('/admin/users')) return 'Benutzer';
    if (pathname.startsWith('/admin/newsletter')) return 'Newsletter';
    if (pathname.startsWith('/admin/analytics')) return 'Analytics';
    if (pathname.startsWith('/admin/settings')) return 'Einstellungen';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Modern Professional Sidebar */}
      <AdminSidebar />

      {/* Main Content Area with Better Responsive Design */}
      <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
        {/* Professional Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600 font-medium">Live Dashboard</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Status Indicator */}
              <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-slate-100 rounded-lg">
                <div className="text-xs text-slate-600 font-medium">
                  {new Date().toLocaleString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </div>
              </div>
              
              {/* User Profile Indicator */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with Better Spacing */}
        <main className="relative">
          {children}
        </main>
      </div>

      {/* Mobile Overlay for Sidebar (when needed) */}
      <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-20 opacity-0 pointer-events-none transition-opacity duration-300" id="mobile-overlay"></div>
    </div>
  );
}