import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Get all user activities for this post
    const activities = await prisma.userActivity.findMany({
      where: { 
        postId,
        consentGiven: true, // Only include consented activities for detailed analysis
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to recent activities
    });

    if (activities.length === 0) {
      return NextResponse.json({
        totalEvents: 0,
        uniqueInteractions: 0,
        engagementRate: 0,
        averageTimeToFirstInteraction: 0,
        mostCommonInteraction: 'none',
        heatmapData: [],
        eventTimeline: [],
        scrollMilestones: [],
      });
    }

    // Group activities by session to calculate engagement metrics
    const sessionActivities = activities.reduce((acc, activity) => {
      if (!acc[activity.sessionId]) {
        acc[activity.sessionId] = [];
      }
      acc[activity.sessionId].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    const uniqueSessions = Object.keys(sessionActivities).length;
    const engagedSessions = Object.values(sessionActivities).filter(
      sessionActs => sessionActs.length > 2 || 
      sessionActs.some(act => act.timeOnPage && act.timeOnPage > 30) ||
      sessionActs.some(act => ['SHARE', 'COMMENT', 'LIKE', 'COPY_TEXT'].includes(act.activityType))
    ).length;

    const engagementRate = uniqueSessions > 0 ? engagedSessions / uniqueSessions : 0;

    // Calculate average time to first interaction
    const timeToFirstInteraction = Object.values(sessionActivities)
      .map(sessionActs => {
        const sortedActs = sessionActs.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const firstPageView = sortedActs.find(act => act.activityType === 'PAGE_VIEW');
        const firstInteraction = sortedActs.find(act => 
          act.activityType !== 'PAGE_VIEW' && act.activityType !== 'SCROLL'
        );
        
        if (firstPageView && firstInteraction) {
          return (new Date(firstInteraction.createdAt).getTime() - 
                  new Date(firstPageView.createdAt).getTime()) / 1000;
        }
        return null;
      })
      .filter(time => time !== null) as number[];

    const averageTimeToFirstInteraction = timeToFirstInteraction.length > 0 
      ? timeToFirstInteraction.reduce((sum, time) => sum + time, 0) / timeToFirstInteraction.length 
      : 0;

    // Find most common interaction type
    const interactionCounts = activities
      .filter(act => act.activityType !== 'PAGE_VIEW')
      .reduce((acc, act) => {
        acc[act.activityType] = (acc[act.activityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const mostCommonInteraction = Object.entries(interactionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    // Generate heatmap data from click activities
    const clickActivities = activities.filter(act => 
      act.activityType === 'CLICK' && act.clickData
    );

    const heatmapData = clickActivities
      .map(act => {
        try {
          const clickData = act.clickData as any;
          if (clickData?.coordinates) {
            return {
              x: clickData.coordinates.x || 0,
              y: clickData.coordinates.y || 0,
              intensity: 1,
              type: act.activityType.toLowerCase(),
            };
          }
        } catch (e) {
          // Ignore invalid click data
        }
        return null;
      })
      .filter(Boolean)
      .reduce((acc, point) => {
        if (!point) return acc;
        
        // Group nearby clicks (within 50px)
        const existing = acc.find(p => 
          Math.abs(p.x - point.x) < 50 && Math.abs(p.y - point.y) < 50
        );
        
        if (existing) {
          existing.intensity += 1;
        } else {
          acc.push(point);
        }
        
        return acc;
      }, [] as any[]);

    // Extract scroll milestones
    const scrollActivities = activities
      .filter(act => act.activityType === 'SCROLL' && act.scrollPercentage)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const scrollMilestones: Array<{
      milestone: number;
      timestamp: string;
      timeToReach: number;
    }> = [];

    const milestoneTargets = [25, 50, 75, 90, 100];
    const firstPageView = activities
      .filter(act => act.activityType === 'PAGE_VIEW')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    if (firstPageView) {
      const startTime = new Date(firstPageView.createdAt).getTime();
      const achievedMilestones = new Set<number>();

      for (const activity of scrollActivities) {
        const scrollPercent = activity.scrollPercentage || 0;
        
        for (const milestone of milestoneTargets) {
          if (scrollPercent >= milestone && !achievedMilestones.has(milestone)) {
            achievedMilestones.add(milestone);
            scrollMilestones.push({
              milestone,
              timestamp: activity.createdAt.toISOString(),
              timeToReach: (new Date(activity.createdAt).getTime() - startTime) / 1000,
            });
          }
        }
      }
    }

    // Create event timeline (last 50 events)
    const eventTimeline = activities
      .slice(0, 50)
      .map(activity => ({
        id: activity.id,
        type: activity.activityType.toLowerCase().replace('_', ' '),
        timestamp: activity.createdAt.toISOString(),
        data: {
          element: activity.clickData ? 
            (activity.clickData as any)?.element || 'unknown' : 
            undefined,
          value: activity.scrollPercentage || 
            (activity.clickData as any)?.value || 
            undefined,
          coordinates: activity.clickData ? 
            (activity.clickData as any)?.coordinates : 
            undefined,
        },
      }));

    const response = {
      totalEvents: activities.length,
      uniqueInteractions: Object.keys(interactionCounts).length,
      engagementRate,
      averageTimeToFirstInteraction,
      mostCommonInteraction,
      heatmapData: heatmapData.slice(0, 20), // Limit for performance
      eventTimeline,
      scrollMilestones,
      sessionStats: {
        totalSessions: uniqueSessions,
        engagedSessions,
        averageEventsPerSession: activities.length / Math.max(uniqueSessions, 1),
      },
      lastUpdated: new Date().toISOString(),
    };

    logger.debug({
      postId,
      totalEvents: activities.length,
      uniqueSessions,
      engagedSessions,
    }, 'Engagement data retrieved');

    return NextResponse.json(response);

  } catch (error) {
    logger.error({ error, postId: params.id }, 'Failed to get engagement data');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}