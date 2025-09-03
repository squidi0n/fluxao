'use client';

import { Trash2, Database } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CacheStats {
  entries: number;
  size: string;
  hitRate: number;
  lastCleared?: string;
}

export function CacheManagementPanel() {
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState<CacheStats>({
    entries: 0,
    size: '0 KB',
    hitRate: 0,
  });

  const handleClearCache = async (type: 'all' | 'posts' | 'users' | 'analytics') => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/cache', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        // Refresh stats after clearing
        await fetchCacheStats();
      }
    } catch (error) {
      // console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/cache');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      // console.error('Failed to fetch cache stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
          <CardDescription>Current cache usage and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold">{stats.entries.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cache Size</p>
              <p className="text-2xl font-bold">{stats.size}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Hit Rate</p>
              <p className="text-2xl font-bold">{stats.hitRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Clear specific cache types or all cached data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Posts Cache</p>
              <p className="text-sm text-muted-foreground">Cached blog posts and content</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleClearCache('posts')}
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Users Cache</p>
              <p className="text-sm text-muted-foreground">Cached user profiles and sessions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleClearCache('users')}
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Analytics Cache</p>
              <p className="text-sm text-muted-foreground">Cached analytics and metrics data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleClearCache('analytics')}
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => handleClearCache('all')}
              disabled={isClearing}
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Clear All Caches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
