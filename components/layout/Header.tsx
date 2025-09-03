'use client';

import { Menu, X, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import SimpleLogout from '@/components/auth/SimpleLogout';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/news/ki-tech', label: 'KI & Tech' },
    { href: '/news/mensch-gesellschaft', label: 'Mensch & Gesellschaft' },
    { href: '/news/design-aesthetik', label: 'Design & Ästhetik' },
    { href: '/news/gaming-kultur', label: 'Gaming & Kultur' },
    { href: '/news/mindset-philosophie', label: 'Mindset & Philosophie' },
    { href: '/news/business-finance', label: 'Business & Finance' },
    { href: '/news/future-science', label: 'Future & Science' },
    { href: '/news/fiction-lab', label: 'Fiction Lab' },
  ];

  return (
    <>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg'
            : 'bg-white dark:bg-gray-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="group flex items-center space-x-2 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-lg"
              aria-label="FluxAO Home"
            >
              <span className="text-3xl font-bold font-orbitron tracking-tight bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 bg-clip-text text-transparent hover:scale-105 hover:bg-gradient-to-bl transition-all duration-500 relative">
                FluxAO
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-600/20 to-pink-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </span>
            </Link>

            {/* Desktop Navigation - ALWAYS VISIBLE ON MEDIUM SCREENS AND UP */}
            <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium min-h-[44px] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 flex items-center ${
                    pathname === item.href ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={user?.role === 'ADMIN' ? '/admin' : '/profile'}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                    aria-label={`Go to ${user?.role === 'ADMIN' ? 'admin panel' : 'profile'}`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    {user?.role === 'ADMIN' && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </Link>

                  <SimpleLogout />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors min-h-[44px] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 flex items-center"
                  >
                    Anmelden
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-4 flex items-center"
                  >
                    Registrieren
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        <div
          className={`absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <span id="mobile-menu-title" className="text-lg font-bold">Menu</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2" role="navigation" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
                  pathname === item.href ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium text-purple-600 hover:text-purple-700 px-3 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              >
                Admin Panel
              </Link>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {!user ? (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  >
                    Anmelden
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-lg font-medium text-purple-600 hover:text-purple-700 px-3 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  >
                    Registrieren
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  >
                    {user?.name || 'Profil'}
                  </Link>
                  <div onClick={() => setIsMenuOpen(false)}>
                    <SimpleLogout />
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Spacer */}
      <div id="main-content" className="h-16" />
    </>
  );
}
