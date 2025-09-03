'use client';

import { LogIn, LogOut, User, Loader2, Crown } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthButton() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <button disabled className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Link
          href={user.role === 'ADMIN' ? '/admin' : '/profile'}
          className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <span>
{(() => {
              const name = user.name || user.email.split('@')[0];
              // Wenn der Name zu lang ist (über 30 Zeichen), kürze ihn
              if (name.length > 30) {
                return name.substring(0, 27) + '...';
              }
              return name;
            })()}
          </span>
          {user.subscription === 'PREMIUM' && (
            <Crown className="w-3 h-3 text-yellow-500" />
          )}
        </Link>
        <button
          onClick={logout}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
          title="Abmelden"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
    >
      <LogIn className="w-3 h-3" />
      <span>Login</span>
    </Link>
  );
}
