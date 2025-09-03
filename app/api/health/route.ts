import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Basic health check data
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {} as Record<string, { status: string; [key: string]: unknown }>,
    };

    // Check query parameter for detailed checks
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      // Database connectivity check
      try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbDuration = Date.now() - dbStart;

        healthCheck.checks.database = {
          status: 'healthy',
          responseTime: `${dbDuration}ms`,
          connection: 'active',
        };
      } catch (dbError) {
        healthCheck.status = 'unhealthy';
        healthCheck.checks.database = {
          status: 'unhealthy',
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? String(dbError) : 'Connection error',
        };
      }

      // Check some key statistics
      try {
        const [postCount, subscriberCount] = await Promise.all([
          prisma.post.count({ where: { status: 'PUBLISHED' } }),
          prisma.newsletterSubscriber.count({ where: { status: 'verified' } }),
        ]);

        healthCheck.checks.content = {
          status: 'healthy',
          publishedPosts: postCount,
          verifiedSubscribers: subscriberCount,
        };
      } catch {
        healthCheck.checks.content = {
          status: 'degraded',
          error: 'Could not retrieve content statistics',
        };
      }

      // Runtime check (Edge compatible)
      healthCheck.checks.runtime = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      };

      // Response time check
      const responseTime = Date.now() - startTime;
      healthCheck.checks.responseTime = {
        status: responseTime < 1000 ? 'healthy' : responseTime < 5000 ? 'warning' : 'unhealthy',
        duration: `${responseTime}ms`,
      };
    }

    // Determine overall status based on individual checks
    if (detailed && healthCheck.checks) {
      const hasUnhealthy = Object.values(healthCheck.checks).some(
        (check) => check.status === 'unhealthy',
      );
      const hasWarning = Object.values(healthCheck.checks).some(
        (check) => check.status === 'warning' || check.status === 'degraded',
      );

      if (hasUnhealthy) {
        healthCheck.status = 'unhealthy';
      } else if (hasWarning) {
        healthCheck.status = 'degraded';
      }
    }

    // Return appropriate status code
    const statusCode =
      healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch {
    // Critical error - service is down
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      error: 'Health check failed',
      details: 'Internal server error',
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}

// HEAD request for simple alive check
export async function HEAD(_request: NextRequest) {
  try {
    // Quick database ping
    await prisma.$queryRaw`SELECT 1`;

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}
