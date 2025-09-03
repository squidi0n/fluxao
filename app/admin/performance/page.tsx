'use client';

import {
  Activity,
  TrendingUp,
  TrendingDown,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetrics {
  timestamp: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
  memorySize: number;
  memoryMax: number;
  redisHits?: number;
  memoryHitRate?: number;
}

interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
}

export default function PerformanceMonitoringPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [webVitals, setWebVitals] = useState<WebVitals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchPerformanceData = async () => {
    try {
      const [metricsRes, cacheRes, vitalsRes] = await Promise.all([
        fetch('/api/admin/performance/metrics'),
        fetch('/api/admin/performance/cache'),
        fetch('/api/admin/performance/web-vitals'),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics || []);
      }

      if (cacheRes.ok) {
        const data = await cacheRes.json();
        setCacheStats(data);
      }

      if (vitalsRes.ok) {
        const data = await vitalsRes.json();
        setWebVitals(data);
      }
    } catch (error) {
      // console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVitalStatus = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
      inp: { good: 200, poor: 500 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value >= threshold.poor) return 'poor';
    return 'needs-improvement';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const latestMetrics = metrics[metrics.length - 1];

  return (
    <div className="w-full py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-muted-foreground mt-2">Real-time performance metrics and monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          <Button onClick={fetchPerformanceData} size="sm" variant="outline">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof latestMetrics?.responseTime === 'number' ? latestMetrics.responseTime.toFixed(0) : '--'} ms
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
            <Progress
              value={Math.min((latestMetrics?.responseTime || 0) / 10, 100)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.hitRate.toFixed(1) || '--'}%</div>
            <p className="text-xs text-muted-foreground">
              {cacheStats?.hits || 0} hits / {cacheStats?.misses || 0} misses
            </p>
            <Progress value={cacheStats?.hitRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof latestMetrics?.errorRate === 'number' ? latestMetrics.errorRate.toFixed(2) : '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">Last 5 minutes</p>
            <div className="mt-2">
              {(latestMetrics?.errorRate || 0) < 1 ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Healthy
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Elevated
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof latestMetrics?.throughput === 'number' ? latestMetrics.throughput.toFixed(0) : '--'} req/s
            </div>
            <p className="text-xs text-muted-foreground">Requests per second</p>
            <div className="mt-2 flex items-center text-xs">
              {(latestMetrics?.throughput ?? 0) > 100 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              )}
              <span>{latestMetrics?.activeConnections || 0} active connections</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      {webVitals && (
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals</CardTitle>
            <CardDescription>Google's metrics for measuring user experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
                  <span
                    className={`text-sm font-bold ${getStatusColor(getVitalStatus('lcp', webVitals.lcp))}`}
                  >
                    {(webVitals.lcp / 1000).toFixed(2)}s
                  </span>
                </div>
                <Progress value={Math.min((4000 - webVitals.lcp) / 40, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">FID (First Input Delay)</span>
                  <span
                    className={`text-sm font-bold ${getStatusColor(getVitalStatus('fid', webVitals.fid))}`}
                  >
                    {webVitals.fid.toFixed(0)}ms
                  </span>
                </div>
                <Progress value={Math.min((300 - webVitals.fid) / 3, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
                  <span
                    className={`text-sm font-bold ${getStatusColor(getVitalStatus('cls', webVitals.cls))}`}
                  >
                    {webVitals.cls.toFixed(3)}
                  </span>
                </div>
                <Progress value={Math.min((0.25 - webVitals.cls) * 400, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">FCP (First Contentful Paint)</span>
                  <span
                    className={`text-sm font-bold ${getStatusColor(getVitalStatus('fcp', webVitals.fcp))}`}
                  >
                    {(webVitals.fcp / 1000).toFixed(2)}s
                  </span>
                </div>
                <Progress value={Math.min((3000 - webVitals.fcp) / 30, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">TTFB (Time to First Byte)</span>
                  <span
                    className={`text-sm font-bold ${getStatusColor(getVitalStatus('ttfb', webVitals.ttfb))}`}
                  >
                    {webVitals.ttfb.toFixed(0)}ms
                  </span>
                </div>
                <Progress value={Math.min((1800 - webVitals.ttfb) / 18, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">INP (Interaction to Next Paint)</span>
                  <span
                    className={`text-sm font-bold ${getStatusColor(getVitalStatus('inp', webVitals.inp))}`}
                  >
                    {webVitals.inp.toFixed(0)}ms
                  </span>
                </div>
                <Progress value={Math.min((500 - webVitals.inp) / 5, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Charts */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
            <CardDescription>Average response time over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#3b82f6"
                  name="Response Time (ms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Throughput & Errors</CardTitle>
            <CardDescription>Request throughput and error rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="throughput"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Throughput (req/s)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="errorRate"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Error Rate (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cache Performance */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
            <CardDescription>Multi-layer cache statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Memory Cache</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Size</span>
                    <span className="font-mono">
                      {cacheStats.memorySize}/{cacheStats.memoryMax}
                    </span>
                  </div>
                  <Progress value={(cacheStats.memorySize / cacheStats.memoryMax) * 100} />
                  {cacheStats.memoryHitRate !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Hit Rate</span>
                      <span className="font-mono">{cacheStats.memoryHitRate.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Redis Cache</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hits</span>
                    <span className="font-mono">{cacheStats.redisHits || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Requests</span>
                    <span className="font-mono">{cacheStats.hits + cacheStats.misses}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Overall Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Errors</span>
                    <span className="font-mono">{cacheStats.errors}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate</span>
                    <Badge variant={cacheStats.hitRate > 80 ? 'default' : 'destructive'}>
                      {cacheStats.hitRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
          <CardDescription>Server resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
              <Legend />
              <Area
                type="monotone"
                dataKey="cpuUsage"
                stackId="1"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                name="CPU Usage (%)"
              />
              <Area
                type="monotone"
                dataKey="memoryUsage"
                stackId="1"
                stroke="#ec4899"
                fill="#ec4899"
                name="Memory Usage (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts */}
      {latestMetrics && (
        <div className="space-y-4">
          {latestMetrics.errorRate > 5 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>High Error Rate</AlertTitle>
              <AlertDescription>
                Error rate is above 5% ({latestMetrics.errorRate.toFixed(2)}%). Investigate
                immediately.
              </AlertDescription>
            </Alert>
          )}

          {latestMetrics.responseTime > 1000 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Slow Response Time</AlertTitle>
              <AlertDescription>
                Average response time is {latestMetrics.responseTime.toFixed(0)}ms. Consider
                optimizing slow endpoints.
              </AlertDescription>
            </Alert>
          )}

          {cacheStats && cacheStats.hitRate < 60 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Low Cache Hit Rate</AlertTitle>
              <AlertDescription>
                Cache hit rate is only {cacheStats.hitRate.toFixed(1)}%. Review caching strategy.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
