'use client';

import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // Only use NextAuth session - no legacy auth
  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading
    }

    if (session?.user) {
      setUser({
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name,
        role: session.user.role || 'USER',
      });
    } else {
      setUser(null);
    }
  }, [session, status]);

  const loading = status === 'loading';

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error('Ungültige Anmeldedaten');
    }

    if (result?.ok) {
      // Force session update
      await update();
      
      // Get fresh session to determine redirect
      const updatedSession = await fetch('/api/auth/session').then(r => r.json());
      
      if (updatedSession?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const refresh = async () => {
    await update();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
