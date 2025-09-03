'use client';

import { SessionProvider } from 'next-auth/react';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/providers/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
