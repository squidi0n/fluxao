import { performance } from 'perf_hooks';
import { observabilityLogger } from './logger';

// Metrics collection interface
interface MetricPoint {
  name: string;
  value: number;
  labels?: Record<string, string | number>;
  timestamp?: number;
}

interface CounterMetric extends MetricPoint {
  type: 'counter';
}

interface GaugeMetric extends MetricPoint {
  type: 'gauge';
}

interface HistogramMetric extends MetricPoint {
  type: 'histogram';
  buckets?: number[];
}

type Metric = CounterMetric | GaugeMetric | HistogramMetric;

// In-memory metrics store
class MetricsStore {
  private counters = new Map<string, { value: number; labels?: Record<string, any> }>();
  private gauges = new Map<string, { value: number; labels?: Record<string, any>; timestamp: number }>();
  private histograms = new Map<string, { buckets: Map<number, number>; sum: number; count: number }>();
  
  // Counter operations
  increment(name: string, value = 1, labels?: Record<string, any>) {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || { value: 0, labels };
    current.value += value;
    this.counters.set(key, current);
    
    observabilityLogger.debug('Counter incremented', {
      metric: name,
      value: current.value,
      increment: value,
      labels,
    });
  }

  // Gauge operations
  setGauge(name: string, value: number, labels?: Record<string, any>) {
    const key = this.getKey(name, labels);
    this.gauges.set(key, {
      value,
      labels,
      timestamp: Date.now(),
    });
    
    observabilityLogger.debug('Gauge set', {
      metric: name,
      value,
      labels,
    });
  }

  // Histogram operations
  observe(name: string, value: number, buckets = [0.1, 0.5, 1, 2.5, 5, 10]) {
    const key = name;
    let histogram = this.histograms.get(key);
    
    if (!histogram) {
      histogram = {
        buckets: new Map(),
        sum: 0,
        count: 0,
      };
      buckets.forEach(bucket => histogram!.buckets.set(bucket, 0));
      this.histograms.set(key, histogram);
    }
    
    histogram.sum += value;
    histogram.count++;
    
    // Increment appropriate buckets
    buckets.forEach(bucket => {
      if (value <= bucket) {
        const current = histogram!.buckets.get(bucket) || 0;
        histogram!.buckets.set(bucket, current + 1);
      }
    });
    
    observabilityLogger.debug('Histogram observed', {
      metric: name,
      value,
      buckets: Array.from(histogram.buckets.entries()),
    });
  }

  // Get all metrics
  getAllMetrics(): Metric[] {
    const metrics: Metric[] = [];
    
    // Counters
    this.counters.forEach(({ value, labels }, key) => {
      const name = key.split('|')[0];
      metrics.push({
        type: 'counter',
        name,
        value,
        labels,
        timestamp: Date.now(),
      });
    });
    
    // Gauges
    this.gauges.forEach(({ value, labels, timestamp }, key) => {
      const name = key.split('|')[0];
      metrics.push({
        type: 'gauge',
        name,
        value,
        labels,
        timestamp,
      });
    });
    
    // Histograms
    this.histograms.forEach((histogram, name) => {
      // Add sum metric
      metrics.push({
        type: 'gauge',
        name: `${name}_sum`,
        value: histogram.sum,
        timestamp: Date.now(),
      });
      
      // Add count metric
      metrics.push({
        type: 'counter',
        name: `${name}_count`,
        value: histogram.count,
        timestamp: Date.now(),
      });
      
      // Add bucket metrics
      histogram.buckets.forEach((count, bucket) => {
        metrics.push({
          type: 'counter',
          name: `${name}_bucket`,
          value: count,
          labels: { le: bucket.toString() },
          timestamp: Date.now(),
        });
      });
    });
    
    return metrics;
  }

  // Reset all metrics
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private getKey(name: string, labels?: Record<string, any>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}|${labelStr}`;
  }
}

// Global metrics store
const metricsStore = new MetricsStore();

// High-level metrics API
export class FluxAOMetrics {
  
  // HTTP Request metrics
  httpRequest(method: string, path: string, statusCode: number, duration: number) {
    const labels = {
      method: method.toUpperCase(),
      path: this.normalizePath(path),
      status_code: statusCode,
      status_class: `${Math.floor(statusCode / 100)}xx`,
    };
    
    metricsStore.increment('http_requests_total', 1, labels);
    metricsStore.observe('http_request_duration_seconds', duration / 1000);
    
    if (statusCode >= 400) {
      metricsStore.increment('http_errors_total', 1, { 
        ...labels,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error' 
      });
    }
  }

  // Database query metrics
  dbQuery(operation: string, table: string, duration: number, success = true) {
    const labels = {
      operation: operation.toLowerCase(),
      table,
      success: success.toString(),
    };
    
    metricsStore.increment('db_queries_total', 1, labels);
    metricsStore.observe('db_query_duration_seconds', duration / 1000);
    
    if (!success) {
      metricsStore.increment('db_errors_total', 1, labels);
    }
  }

  // Cache metrics
  cache(operation: 'hit' | 'miss' | 'set' | 'delete' | 'clear', key?: string) {
    metricsStore.increment('cache_operations_total', 1, { operation });
    
    if (operation === 'hit' || operation === 'miss') {
      metricsStore.increment('cache_requests_total', 1, { result: operation });
    }
  }

  // AI/ML metrics
  aiRequest(provider: string, model: string, tokenCount: number, duration: number, success = true) {
    const labels = {
      provider,
      model,
      success: success.toString(),
    };
    
    metricsStore.increment('ai_requests_total', 1, labels);
    metricsStore.increment('ai_tokens_total', tokenCount, labels);
    metricsStore.observe('ai_request_duration_seconds', duration / 1000);
    
    if (!success) {
      metricsStore.increment('ai_errors_total', 1, labels);
    }
  }

  // Business metrics
  userSignup(source: string) {
    metricsStore.increment('user_signups_total', 1, { source });
  }

  newsletterSubscription(action: 'subscribe' | 'unsubscribe' | 'bounce') {
    metricsStore.increment('newsletter_subscriptions_total', 1, { action });
  }

  postPublished(category: string, author: string) {
    metricsStore.increment('posts_published_total', 1, { category, author });
  }

  commentModeration(action: 'approve' | 'reject' | 'spam', automated: boolean) {
    metricsStore.increment('comment_moderations_total', 1, { 
      action, 
      automated: automated.toString() 
    });
  }

  // System metrics
  setActiveConnections(count: number) {
    metricsStore.setGauge('active_connections', count);
  }

  setMemoryUsage(heapUsed: number, heapTotal: number, rss: number) {
    metricsStore.setGauge('memory_heap_used_bytes', heapUsed);
    metricsStore.setGauge('memory_heap_total_bytes', heapTotal);
    metricsStore.setGauge('memory_rss_bytes', rss);
  }

  setCpuUsage(percentage: number) {
    metricsStore.setGauge('cpu_usage_percentage', percentage);
  }

  // Event loop lag
  setEventLoopLag(lagMs: number) {
    metricsStore.setGauge('event_loop_lag_seconds', lagMs / 1000);
  }

  // Custom business metrics
  setUserCount(total: number, active: number, premium: number) {
    metricsStore.setGauge('users_total', total);
    metricsStore.setGauge('users_active', active);
    metricsStore.setGauge('users_premium', premium);
  }

  setPostStats(total: number, published: number, draft: number) {
    metricsStore.setGauge('posts_total', total);
    metricsStore.setGauge('posts_published', published);
    metricsStore.setGauge('posts_draft', draft);
  }

  // Utility methods
  private normalizePath(path: string): string {
    // Replace dynamic segments with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\?.*$/, ''); // Remove query parameters
  }

  // Get all metrics for export
  getAllMetrics() {
    return metricsStore.getAllMetrics();
  }

  // Reset metrics (useful for testing)
  reset() {
    metricsStore.reset();
  }
}

// Performance measurement utility
export class PerformanceTimer {
  private startTime: number;
  private name: string;
  private labels?: Record<string, any>;

  constructor(name: string, labels?: Record<string, any>) {
    this.name = name;
    this.labels = labels;
    this.startTime = performance.now();
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    
    metricsStore.observe(`${this.name}_duration_seconds`, duration / 1000);
    
    observabilityLogger.performance(this.name, duration, this.labels);
    
    return duration;
  }
}

// Singleton metrics instance
export const metrics = new FluxAOMetrics();

// Timer utility function
export function timer(name: string, labels?: Record<string, any>) {
  return new PerformanceTimer(name, labels);
}

// Decorator for automatic performance measurement
export function timed(metricName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const perfTimer = timer(name);
      try {
        const result = await method.apply(this, args);
        perfTimer.end();
        return result;
      } catch (error) {
        perfTimer.end();
        throw error;
      }
    };
  };
}

// System metrics collection
export function startSystemMetricsCollection(intervalMs = 10000) {
  const collect = () => {
    const memUsage = process.memoryUsage();
    metrics.setMemoryUsage(memUsage.heapUsed, memUsage.heapTotal, memUsage.rss);

    const cpuUsage = process.cpuUsage();
    // Calculate CPU percentage (simplified)
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100;
    metrics.setCpuUsage(cpuPercent);

    // Event loop lag measurement
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      metrics.setEventLoopLag(lag);
    });
  };

  // Initial collection
  collect();
  
  // Schedule regular collection
  const interval = setInterval(collect, intervalMs);
  
  // Cleanup function
  return () => clearInterval(interval);
}

export default metrics;