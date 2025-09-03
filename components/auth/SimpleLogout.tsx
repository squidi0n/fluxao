'use client';

import { LogOut } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

export default function SimpleLogout() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
      aria-label="Sign out"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Abmelden</span>
    </button>
  );
}