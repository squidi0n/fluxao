import {
  Database,
  Zap,
  Activity,
  BarChart3,
  RefreshCw,
  Trash2,
  TrendingUp,
  Server,
} from 'lucide-react';
import { Suspense } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getCacheStats() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3005';
    const response = await fetch(`${baseUrl}/api/admin/cache`, {
      cache: 'no-store', // Always get fresh stats
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cache stats');
    }

    return await response.json();
  } catch (error) {
    // console.error('Error fetching cache stats:', error);
    return null;
  }
}

function CacheStatsCards({ stats }: { stats: any }) {
  const redisStatus = stats?.redis?.connected ? 'Connected' : 'Disconnected';
  const redisVariant = stats?.redis?.connected ? 'default' : 'destructive';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Redis Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Redis Cache</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              <Badge variant={redisVariant as any}>{redisStatus}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Cache Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.prisma?.totalKeys?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.prisma?.prismaKeys || 0} Prisma queries cached
          </p>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.memory?.heapUsed || 0} MB</div>
          <p className="text-xs text-muted-foreground">
            {stats?.memory?.heapTotal || 0} MB total heap
          </p>
        </CardContent>
      </Card>

      {/* Cache Hit Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Optimized</div>
          <p className="text-xs text-muted-foreground">Caching active</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ModelBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No cached queries found</p>
      </div>
    );
  }

  const sortedModels = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10 models

  const totalCached = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      {sortedModels.map(([model, count]) => {
        const percentage = totalCached > 0 ? (count / totalCached) * 100 : 0;

        return (
          <div key={model} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium capitalize">{model}</span>
              <span className="text-muted-foreground">
                {count} queries ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CacheManagementActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Cache Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Use these tools carefully. Clearing cache will temporarily reduce performance while
              the cache rebuilds.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Stats
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    // This would trigger cache warmup
                    // console.log('Warming up cache...');
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Warm Cache
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Danger Zone</h4>
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all cache?')) {
                      // This would clear all cache
                      // console.log('Clearing all cache...');
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Cache
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function CacheStatsData() {
  const stats = await getCacheStats();

  if (!stats) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load cache statistics. Make sure Redis is running and accessible.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <CacheStatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Model Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cached Queries by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ModelBreakdown breakdown={stats.prisma?.modelBreakdown || {}} />
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Redis Status:</span>
                  <Badge
                    variant={stats.redis?.connected ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {stats.redis?.status}
                  </Badge>
                </div>

                <div>
                  <span className="font-medium">Timestamp:</span>
                  <span className="ml-2 text-muted-foreground">
                    {stats.timestamp ? new Date(stats.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>

                {stats.memory && (
                  <>
                    <div>
                      <span className="font-medium">RSS Memory:</span>
                      <span className="ml-2">{stats.memory.rss} MB</span>
                    </div>

                    <div>
                      <span className="font-medium">External:</span>
                      <span className="ml-2">{stats.memory.external} MB</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CacheManagementActions />
    </div>
  );
}

export default function CacheManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cache Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage application caching performance
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <CacheStatsData />
      </Suspense>
    </div>
  );
}
