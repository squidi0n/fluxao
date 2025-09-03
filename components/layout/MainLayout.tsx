'use client';

import { ReactNode } from 'react';

import Footer from './Footer';
import Header from './Header';

import { useTheme } from '@/providers/theme-provider';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function MainLayout({ children, className = '' }: MainLayoutProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === 'dark'
          ? 'bg-gray-900 text-white'
          : theme === 'blue'
            ? 'bg-slate-900 text-slate-100'
            : 'bg-white text-gray-900'
      }`}
    >
      <Header />
      <main className={`flex-1 ${className}`}>{children}</main>
      <Footer />
    </div>
  );
}
