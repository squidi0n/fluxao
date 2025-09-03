import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserFromCookies } from '@/lib/auth';

// Simple in-memory storage for quick feedback (in production, use database)
const quickFeedback: Array<{
  id: string;
  type: string;
  message: string;
  url: string;
  userAgent: string;
  userId?: string;
  timestamp: Date;
}> = [];

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement']),
  message: z.string().min(1).max(1000),
  url: z.string().url(),
  userAgent: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies();
    const body = await request.json();

    const validatedData = feedbackSchema.parse(body);

    // Store feedback
    const feedback = {
      id: `QF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      userId: user?.id,
      timestamp: new Date(),
    };

    quickFeedback.push(feedback);

    // In production, save to database and send notifications
    // await prisma.quickFeedback.create({ data: feedback })
    // await sendNotificationEmail(feedback)

    // Log for monitoring
    // console.log('Quick feedback received:', {
    //   type: feedback.type,
    //   url: feedback.url,
    //   userId: feedback.userId,
    // });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      id: feedback.id,
    });
  } catch (error) {
    // console.error('Quick feedback error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

// Admin endpoint to retrieve quick feedback
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies();

    // Check if user is admin
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let filtered = quickFeedback;
    if (type) {
      filtered = quickFeedback.filter((f) => f.type === type);
    }

    // Sort by most recent and limit
    const sorted = filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return NextResponse.json({
      feedback: sorted,
      total: filtered.length,
    });
  } catch (error) {
    // console.error('Failed to fetch quick feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
