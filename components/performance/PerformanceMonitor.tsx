'use client';

import { Zap, Clock, Download, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Network
  connectionType?: string;
  downlink?: number;

  // Memory
  memoryUsage?: number;
  memoryLimit?: number;

  // Navigation
  loadTime?: number;
  domContentLoaded?: number;

  // Cache performance
  cacheHits?: number;
  cacheMisses?: number;
}

function getPerformanceScore(
  value: number,
  thresholds: [number, number],
): {
  score: 'good' | 'needs-improvement' | 'poor';
  color: string;
  percentage: number;
} {
  const [good, poor] = thresholds;

  if (value <= good) {
    return { score: 'good', color: 'text-green-600', percentage: 100 };
  } else if (value <= poor) {
    return { score: 'needs-improvement', color: 'text-yellow-600', percentage: 75 };
  } else {
    return { score: 'poor', color: 'text-red-600', percentage: 25 };
  }
}

function ScoreIndicator({
  label,
  value,
  unit,
  thresholds,
}: {
  label: string;
  value: number;
  unit: string;
  thresholds: [number, number];
}) {
  const { score, color, percentage } = getPerformanceScore(value, thresholds);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`font-semibold ${color}`}>
          {value.toFixed(0)}
          {unit}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex items-center gap-1 text-xs">
        {score === 'good' && <CheckCircle className="h-3 w-3 text-green-600" />}
        {score === 'needs-improvement' && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
        {score === 'poor' && <XCircle className="h-3 w-3 text-red-600" />}
        <span className="capitalize">{score.replace('-', ' ')}</span>
      </div>
    </div>
  );
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      let lcp = 0;
      let cls = 0;
      let fid = 0;

      // Collect LCP
      if ('LargestContentfulPaint' in window) {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            lcp = entries[entries.length - 1].startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }

      // Collect CLS
      if ('LayoutShift' in window) {
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      }

      // Collect FID
      if ('FirstInputDelay' in window) {
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            fid = (entry as any).processingStart - entry.startTime;
          }
        }).observe({ type: 'first-input', buffered: true });
      }

      // Basic metrics
      const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime;
      const ttfb = navigation?.responseStart - navigation?.requestStart;

      const newMetrics: PerformanceMetrics = {
        lcp,
        fid,
        cls,
        fcp,
        ttfb,
        loadTime: navigation?.loadEventEnd - navigation?.navigationStart,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart,
      };

      // Network information
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.connectionType = connection?.effectiveType || 'unknown';
        newMetrics.downlink = connection?.downlink;
      }

      // Memory information
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryUsage = memory?.usedJSHeapSize / 1024 / 1024; // MB
        newMetrics.memoryLimit = memory?.jsHeapSizeLimit / 1024 / 1024; // MB
      }

      setMetrics(newMetrics);
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      setTimeout(collectMetrics, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(collectMetrics, 1000);
      });
    }

    // Check for cache performance headers
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('/api/')) {
          // Check for cache headers in responses
          // This would need to be implemented with custom fetch wrapper
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Show/hide monitor
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Monitor"
      >
        <Activity className="h-5 w-5" />
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-40 w-80 max-h-96 overflow-auto">
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Core Web Vitals */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-blue-600">Core Web Vitals</h4>
                <div className="space-y-3">
                  {metrics.lcp && (
                    <ScoreIndicator
                      label="LCP"
                      value={metrics.lcp}
                      unit="ms"
                      thresholds={[2500, 4000]}
                    />
                  )}
                  {metrics.fid !== undefined && (
                    <ScoreIndicator
                      label="FID"
                      value={metrics.fid}
                      unit="ms"
                      thresholds={[100, 300]}
                    />
                  )}
                  {metrics.cls !== undefined && (
                    <ScoreIndicator
                      label="CLS"
                      value={metrics.cls}
                      unit=""
                      thresholds={[0.1, 0.25]}
                    />
                  )}
                </div>
              </div>

              {/* Load Times */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-green-600">Load Performance</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {metrics.fcp && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>FCP: {metrics.fcp.toFixed(0)}ms</span>
                    </div>
                  )}
                  {metrics.ttfb && (
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>TTFB: {metrics.ttfb.toFixed(0)}ms</span>
                    </div>
                  )}
                  {metrics.domContentLoaded && (
                    <div className="flex items-center gap-1">
                      <span>DOM: {metrics.domContentLoaded.toFixed(0)}ms</span>
                    </div>
                  )}
                  {metrics.loadTime && (
                    <div className="flex items-center gap-1">
                      <span>Load: {metrics.loadTime.toFixed(0)}ms</span>
                    </div>
                  )}
                </div>
              </div>

              {/* System Info */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-purple-600">System</h4>
                <div className="space-y-1 text-xs">
                  {metrics.connectionType && (
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <Badge variant="outline" className="text-xs">
                        {metrics.connectionType}
                      </Badge>
                    </div>
                  )}
                  {metrics.downlink && (
                    <div className="flex justify-between">
                      <span>Downlink:</span>
                      <span>{metrics.downlink.toFixed(1)} Mbps</span>
                    </div>
                  )}
                  {metrics.memoryUsage && (
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span>
                        {metrics.memoryUsage.toFixed(1)}MB
                        {metrics.memoryLimit && ` / ${metrics.memoryLimit.toFixed(0)}MB`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
