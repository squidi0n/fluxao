import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// In-memory metrics storage (in production, use a time-series database)
const metricsHistory: any[] = [];
const MAX_HISTORY = 100;

// Collect current metrics
async function collectMetrics() {
  const now = Date.now();
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

  const recentEvents = await prisma.analyticsEvent.findMany({
    where: {
      OR: [
        { type: 'pageview' },
        { type: 'api' },
        { type: 'error' },
      ],
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
    select: {
      properties: true,
      type: true,
    },
    take: 100,
  });

  // Calculate average response time if available on events
  const responseTimes: number[] = [];
  let errorCount = 0;
  for (const evt of recentEvents) {
    const p: any = evt.properties || {};
    if (typeof p.responseTimeMs === 'number') {
      responseTimes.push(p.responseTimeMs);
    }
    if (evt.type === 'error' || p.error) {
      errorCount += 1;
    }
  }
  const responseTime = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null;

  // Throughput and error rate
  const throughput = recentEvents.length / 300; // req/s over last 5 minutes
  const errorRate = recentEvents.length ? (errorCount / recentEvents.length) * 100 : 0;

  // Unknown without system integration
  const cpuUsage = null as number | null;
  const memoryUsage = null as number | null;
  const activeConnections = null as number | null;
  const cacheHitRate = null as number | null;

  const metrics = {
    timestamp: now,
    responseTime,
    throughput,
    errorRate,
    cacheHitRate,
    cpuUsage,
    memoryUsage,
    activeConnections,
  };

  // Store in history
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.shift();
  }

  return metrics;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Collect current metrics
    await collectMetrics();

    // Return metrics history
    return NextResponse.json({
      metrics: metricsHistory,
      current: metricsHistory[metricsHistory.length - 1],
    });
  } catch (error) {
    // console.error('Performance metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
