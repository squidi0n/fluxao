import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aggregate recent web vitals from analytics events
    const since = new Date(Date.now() - 60 * 60 * 1000); // last hour
    const events = await prisma.analyticsEvent.findMany({
      where: { type: 'web_vitals', createdAt: { gte: since } },
      select: { properties: true },
      take: 500,
    });

    const acc = { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0, inp: 0 } as any;
    let count = 0;
    for (const e of events) {
      const p: any = e.properties || {};
      if (typeof p.lcp === 'number') { acc.lcp += p.lcp; count++; }
      if (typeof p.fid === 'number') { acc.fid += p.fid; }
      if (typeof p.cls === 'number') { acc.cls += p.cls; }
      if (typeof p.fcp === 'number') { acc.fcp += p.fcp; }
      if (typeof p.ttfb === 'number') { acc.ttfb += p.ttfb; }
      if (typeof p.inp === 'number') { acc.inp += p.inp; }
    }

    const normalize = (val: number) => (count ? val / count : null);
    return NextResponse.json({
      lcp: normalize(acc.lcp),
      fid: normalize(acc.fid),
      cls: normalize(acc.cls),
      fcp: normalize(acc.fcp),
      ttfb: normalize(acc.ttfb),
      inp: normalize(acc.inp),
    });
  } catch (error) {
    // console.error('Web vitals error:', error);
    return NextResponse.json({ error: 'Failed to fetch web vitals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint would receive Web Vitals data from the client
    const body = await request.json();

    // Store in analytics events
    await prisma.analyticsEvent.create({
      data: {
        type: 'web_vitals',
        properties: body,
        sessionId: body.sessionId,
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('Web vitals recording error:', error);
    return NextResponse.json({ error: 'Failed to record web vitals' }, { status: 500 });
  }
}
