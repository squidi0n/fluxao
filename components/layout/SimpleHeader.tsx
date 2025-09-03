'use client';

import { Menu, X, Search, User, Settings, LogOut, Bell, MessageSquare, Quote, Users, FileText, Newspaper, BookOpen, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import AuthButton from '@/components/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';

export default function SimpleHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user } = useAuth();
  const { categories } = useCategories();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 transition-all duration-300 ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Spacer */}
            <div className="flex-1" />
            
            {/* Center - Logo */}
            <Link href="/" className="flex flex-col items-center group" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              <span
                className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent group-hover:scale-110 transition-all duration-300 group-hover:from-cyan-500 group-hover:via-purple-600 group-hover:to-pink-500"
                style={{ letterSpacing: '0.05em', fontFamily: '"Good Timing", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                FLUXAO
              </span>
              <div className="bg-white dark:bg-gray-900 px-4 py-1 rounded-md shadow-sm" style={{ marginTop: '-10px' }}>
                <span className="text-xs text-gray-900 dark:text-white tracking-[0.25em] uppercase font-exo2 font-medium">
                  Mensch · Maschine · Technologie
                </span>
              </div>
            </Link>

            
            {/* Right Spacer */}
            <div className="flex-1" />

            {/* Right Side - Navigation & User */}
            <div className="flex items-center space-x-4">

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <AuthButton />
                    </div>
                    {user && (
                      <div className="p-1">
                        <Link href="/profile" className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <Settings className="w-4 h-4" />
                          <span>Einstellungen</span>
                        </Link>
                        <Link href="/notifications" className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <Bell className="w-4 h-4" />
                          <span>Benachrichtigungen</span>
                        </Link>
                        <Link href="/comments" className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <MessageSquare className="w-4 h-4" />
                          <span>Meine Kommentare</span>
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                            <Link href="/admin" className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                              <Zap className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-12">            
            <nav className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
              <Link href="/" className="text-sm font-medium whitespace-nowrap transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Start
              </Link>
              {categories.map((category) => (
                <Link 
                  key={category.id}
                  href={`/category/${category.slug}`} 
                  className={`text-sm font-medium whitespace-nowrap transition-colors ${
                    pathname?.includes(`/category/${category.slug}`) 
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-3'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 overflow-y-auto ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Menü</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Artikel durchsuchen..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>

          <nav className="p-4 space-y-6">
            {/* Main Navigation */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Navigation</h3>
              <div className="space-y-2">
                <Link href="/" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <BookOpen className="w-5 h-5" />
                  <span>Start</span>
                </Link>
                <Link href="/blog" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>Blog</span>
                </Link>
                <Link href="/quotes" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Quote className="w-5 h-5" />
                  <span>Quotes</span>
                </Link>
                <Link href="/newsletter" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Newspaper className="w-5 h-5" />
                  <span>Newsletter</span>
                </Link>
                <Link href="/about" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Users className="w-5 h-5" />
                  <span>About</span>
                </Link>
                <Link href="/trending" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <TrendingUp className="w-5 h-5" />
                  <span>Trending</span>
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Kategorien</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Link 
                    key={category.id}
                    href={`/category/${category.slug}`} 
                    className="block p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Account</h3>
                  <div className="space-y-2">
                    <Link href="/profile" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <Settings className="w-5 h-5" />
                      <span>Einstellungen</span>
                    </Link>
                    <Link href="/notifications" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <Bell className="w-5 h-5" />
                      <span>Benachrichtigungen</span>
                    </Link>
                    <Link href="/comments" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <MessageSquare className="w-5 h-5" />
                      <span>Meine Kommentare</span>
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                        <Link href="/admin" className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                          <Zap className="w-5 h-5" />
                          <span>Admin Panel</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
              
              <div className="mt-4">
                <AuthButton />
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Spacer for fixed headers */}
      <div className="h-28" />
    </>
  );
}
