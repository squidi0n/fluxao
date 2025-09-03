import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, role: true }
    });

    if (!user?.isAdmin && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get newsletter statistics
    const [
      totalSubscribers,
      verifiedSubscribers,
      unsubscribedSubscribers,
      pendingSubscribers,
      totalCampaigns,
      sentCampaigns,
      totalTemplates,
      recentSignups
    ] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { status: 'verified' } }),
      prisma.newsletterSubscriber.count({ where: { status: 'unsubscribed' } }),
      prisma.newsletterSubscriber.count({ where: { status: 'pending' } }),
      prisma.newsletterCampaign.count(),
      prisma.newsletterCampaign.count({ where: { status: 'sent' } }),
      prisma.newsletterTemplate.count(),
      prisma.newsletterSubscriber.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    // Calculate engagement metrics
    const engagementStats = await prisma.newsletterInteraction.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Convert engagement stats to object
    const engagementMetrics = engagementStats.reduce((acc, stat) => {
      acc[stat.type.toLowerCase()] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get recent campaign performance
    const recentCampaigns = await prisma.newsletterCampaign.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      where: { status: 'sent' },
      select: {
        id: true,
        name: true,
        subject: true,
        sentAt: true,
        stats: true,
        _count: {
          select: {
            recipients: true
          }
        }
      }
    });

    // Calculate monthly growth
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const monthlyGrowth = await prisma.newsletterSubscriber.count({
      where: {
        createdAt: { gte: lastMonth },
        status: 'verified'
      }
    });

    const stats = {
      subscribers: {
        total: totalSubscribers,
        verified: verifiedSubscribers,
        pending: pendingSubscribers,
        unsubscribed: unsubscribedSubscribers,
        recentSignups,
        monthlyGrowth,
        verificationRate: totalSubscribers > 0 ? (verifiedSubscribers / totalSubscribers * 100).toFixed(1) : '0'
      },
      campaigns: {
        total: totalCampaigns,
        sent: sentCampaigns,
        successRate: totalCampaigns > 0 ? (sentCampaigns / totalCampaigns * 100).toFixed(1) : '0'
      },
      templates: {
        total: totalTemplates
      },
      engagement: {
        opens: engagementMetrics.open || 0,
        clicks: engagementMetrics.click || 0,
        unsubscribes: engagementMetrics.unsubscribe || 0,
        clickThroughRate: engagementMetrics.open > 0 ? ((engagementMetrics.click || 0) / engagementMetrics.open * 100).toFixed(1) : '0'
      },
      recentCampaigns: recentCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        sentAt: campaign.sentAt,
        recipientCount: campaign._count.recipients,
        stats: campaign.stats
      }))
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to fetch newsletter stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch newsletter statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}