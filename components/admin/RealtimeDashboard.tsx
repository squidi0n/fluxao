'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import EnhancedAdminDashboard from './EnhancedAdminDashboard';

interface RealtimeDashboardProps {
  initialStats: any;
}

interface QuickStats {
  pendingComments: number;
  systemAlerts: number;
  activeUserSessions: number;
  todayPosts: number;
  todayUsers: number;
  supportTicketsOpen: number;
  aiUsageToday: number;
  dbStatus: string;
  lastUpdated: string;
}

export default function RealtimeDashboard({ initialStats }: RealtimeDashboardProps) {
  const [stats, setStats] = useState(initialStats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to fetch real-time updates
  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const quickStats: QuickStats = await response.json();
        
        // Update the relevant stats with real-time data
        setStats(prev => ({
          ...prev,
          pendingComments: quickStats.pendingComments,
          systemAlerts: quickStats.systemAlerts,
          activeUserSessions: quickStats.activeUserSessions,
          todayPosts: quickStats.todayPosts,
          todayUsers: quickStats.todayUsers,
          supportTicketsOpen: quickStats.supportTicketsOpen,
          aiUsageToday: quickStats.aiUsageToday,
          dbStatus: quickStats.dbStatus,
        }));
        
        setLastUpdated(new Date(quickStats.lastUpdated));
      }
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Real-time update controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white shadow-lg rounded-lg p-2 border">
        <div className="text-xs text-gray-500">
          Aktualisiert: {lastUpdated.toLocaleTimeString('de-DE')}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStats}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Aktualisiere...' : 'Aktualisieren'}
        </Button>
      </div>

      {/* Main dashboard */}
      <EnhancedAdminDashboard stats={stats} />
    </div>
  );
}