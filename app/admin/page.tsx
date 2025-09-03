import { Metadata } from 'next';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import RealtimeDashboard from '@/components/admin/RealtimeDashboard';

export const metadata: Metadata = {
  title: 'Dashboard - Admin - FluxAO',
};

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalUsers,
    totalViews,
    verifiedSubscriberCount,
    pendingSubscribers,
    newUsersCount,
    monthlyViews,
    weeklyPosts,
    todayPosts,
    totalComments,
    pendingComments,
    yesterdayViews,
    todayUsers,
    systemAlerts,
    aiUsageToday,
    recentSecurityEvents,
    activeUserSessions,
    totalNewsletterSent,
    supportTicketsOpen,
    subscriptionsActive,
    revenueThisMonth,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.user.count(),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.newsletterSubscriber.count({ where: { verifiedAt: { not: null } } }),
    prisma.newsletterSubscriber.count({ where: { verifiedAt: null, status: 'pending' } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.post.aggregate({
      where: { publishedAt: { gte: thirtyDaysAgo } },
      _sum: { viewCount: true },
    }),
    prisma.post.count({ where: { 
      status: 'PUBLISHED', 
      publishedAt: { gte: sevenDaysAgo } 
    } }),
    prisma.post.count({ where: { 
      createdAt: { gte: startOfToday }
    } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.post.aggregate({
      where: { publishedAt: { gte: yesterday, lt: now } },
      _sum: { viewCount: true },
    }),
    prisma.user.count({ where: { 
      lastLoginAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } 
    } }),
    // Safe queries with fallbacks for optional tables
    prisma.systemAlert?.count({ where: { resolved: false } }).catch(() => 0) || Promise.resolve(0),
    prisma.aiTaskLog?.count({ where: { createdAt: { gte: startOfToday } } }).catch(() => 0) || Promise.resolve(0),
    prisma.securityEvent?.count({ 
      where: { 
        createdAt: { gte: sevenDaysAgo },
        severity: { in: ['warning', 'error', 'critical'] }
      } 
    }).catch(() => 0) || Promise.resolve(0),
    prisma.session?.count({ 
      where: { 
        expires: { gt: now }
      } 
    }).catch(() => 0) || Promise.resolve(0),
    prisma.newsletterJob?.count({ 
      where: { 
        status: 'sent',
        processedAt: { gte: thirtyDaysAgo }
      } 
    }).catch(() => 0) || Promise.resolve(0),
    prisma.supportTicket?.count({ 
      where: { 
        status: { in: ['open', 'in_progress'] }
      } 
    }).catch(() => 0) || Promise.resolve(0),
    prisma.subscription?.count({ 
      where: { 
        status: 'ACTIVE'
      } 
    }).catch(() => 0) || Promise.resolve(0),
    prisma.revenueRecord?.aggregate({
      where: { 
        recordedAt: { 
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      },
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: 0 } })) || Promise.resolve({ _sum: { amount: 0 } })
  ]);

  // Calculate real trends based on actual data
  const previousMonthViews = await prisma.post.aggregate({
    where: { 
      publishedAt: { 
        gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        lt: thirtyDaysAgo
      } 
    },
    _sum: { viewCount: true },
  });

  const previousMonthUsers = await prisma.user.count({ 
    where: { 
      createdAt: { 
        gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        lt: thirtyDaysAgo
      } 
    } 
  });

  const viewsGrowth = previousMonthViews._sum.viewCount ? 
    Math.round(((monthlyViews._sum.viewCount || 0) - (previousMonthViews._sum.viewCount || 0)) / (previousMonthViews._sum.viewCount || 1) * 100) : 0;
    
  const userGrowth = previousMonthUsers > 0 ? 
    Math.round(((newUsersCount || 0) - previousMonthUsers) / previousMonthUsers * 100) : 0;

  // Database connection test
  const dbStatus = await prisma.$queryRaw`SELECT 1 as connected`.then(() => 'ONLINE').catch(() => 'OFFLINE');

  return {
    // Core metrics
    totalPosts,
    publishedPosts,
    draftPosts,
    totalUsers,
    totalViews: totalViews._sum.viewCount || 0,
    verifiedSubscriberCount,
    pendingSubscribers,
    newUsersCount,
    monthlyViews: monthlyViews._sum.viewCount || 0,
    weeklyPosts,
    todayPosts,
    totalComments,
    pendingComments,
    todayUsers,
    
    // System health
    dbStatus,
    systemAlerts,
    aiUsageToday,
    recentSecurityEvents,
    activeUserSessions,
    
    // Business metrics
    totalNewsletterSent,
    supportTicketsOpen,
    subscriptionsActive,
    revenueThisMonth: (revenueThisMonth._sum.amount || 0) / 100, // Convert from cents to euros
    
    // Real trends
    trends: {
      viewsGrowth: viewsGrowth > 0 ? `+${viewsGrowth}%` : `${viewsGrowth}%`,
      userGrowth: userGrowth > 0 ? `+${userGrowth}%` : `${userGrowth}%`,
      subscriberGrowth: pendingSubscribers > 0 ? `+${Math.round((verifiedSubscriberCount / (verifiedSubscriberCount + pendingSubscribers)) * 100)}%` : '0%',
      commentsGrowth: pendingComments > 0 ? `${Math.round((pendingComments / totalComments) * 100)}%` : '0%'
    }
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  
  return <RealtimeDashboard initialStats={stats} />;
}