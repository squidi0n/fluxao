import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { getAnalyticsSummary } from '@/lib/analytics';
import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { hasRole } from '@/lib/rbac';

// GET /api/analytics/summary - Get analytics summary (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const token = await getToken({ req: request });
    if (!token || !hasRole(token.role, Role.ADMIN)) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'Admin role required',
      });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';

    // Validate timeframe
    const validTimeframes = ['24h', '7d', '30d'];
    if (!validTimeframes.includes(timeframe)) {
      return createProblemResponse({
        status: 400,
        title: 'Invalid Timeframe',
        detail: 'Timeframe must be one of: 24h, 7d, 30d',
      });
    }

    const summary = await getAnalyticsSummary(timeframe);

    logger.info(
      {
        adminId: token.sub,
        timeframe,
        pageviews: summary.pageviews,
        uniqueVisitors: summary.uniqueVisitors,
      },
      'Analytics summary requested',
    );

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get analytics summary');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to get analytics summary',
    });
  }
}
