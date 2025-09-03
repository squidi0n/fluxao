import { NextRequest, NextResponse } from 'next/server';

import { recomputePostScores } from '@/lib/jobs/recomputePostScore';

// This should be called by a cron service (e.g., Vercel Cron, GitHub Actions, or external service)
export async function GET(request: NextRequest) {
  // Optional: Add secret key check for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await recomputePostScores();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    // console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
