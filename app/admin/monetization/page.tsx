import {
  DollarSign,
  Users,
  ExternalLink,
  Eye,
  CreditCard,
  TrendingUp,
  Star,
  Crown,
} from 'lucide-react';
import { Suspense } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

async function getMonetizationStats() {
  try {
    // Revenue stats
    const totalRevenue = await prisma.revenueRecord.aggregate({
      _sum: { amount: true },
      where: {
        recordedAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    // Subscription stats
    const subscriptions = await prisma.subscription.groupBy({
      by: ['status', 'plan'],
      _count: true,
      where: {
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    // Affiliate stats
    const affiliateStats = await prisma.affiliateLink.aggregate({
      _sum: {
        clicks: true,
        conversions: true,
        revenue: true,
      },
    });

    // Ad stats
    const adStats = await prisma.adSlot.aggregate({
      _sum: {
        impressions: true,
        clicks: true,
        revenue: true,
      },
    });

    // Top performing affiliate links
    const topAffiliateLinks = await prisma.affiliateLink.findMany({
      take: 5,
      orderBy: { clicks: 'desc' },
      where: { isActive: true },
    });

    // Recent revenue
    const recentRevenue = await prisma.revenueRecord.findMany({
      take: 10,
      orderBy: { recordedAt: 'desc' },
    });

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      subscriptions,
      affiliateStats,
      adStats,
      topAffiliateLinks,
      recentRevenue,
    };
  } catch (error) {
    // console.error('Error fetching monetization stats:', error);
    return {
      totalRevenue: 0,
      subscriptions: [],
      affiliateStats: { _sum: { clicks: 0, conversions: 0, revenue: 0 } },
      adStats: { _sum: { impressions: 0, clicks: 0, revenue: 0 } },
      topAffiliateLinks: [],
      recentRevenue: [],
    };
  }
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount / 100); // Convert cents to euros
}

function RevenueOverview({ stats }: { stats: any }) {
  const activeSubscriptions = stats.subscriptions.reduce(
    (acc: number, sub: any) => acc + sub._count,
    0,
  );

  const proSubscriptions = stats.subscriptions
    .filter((sub: any) => sub.plan === 'PRO')
    .reduce((acc: number, sub: any) => acc + sub._count, 0);

  const premiumSubscriptions = stats.subscriptions
    .filter((sub: any) => sub.plan === 'PREMIUM')
    .reduce((acc: number, sub: any) => acc + sub._count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions}</div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              {proSubscriptions} Pro
            </Badge>
            <Badge variant="default" className="text-xs">
              <Crown className="w-3 h-3 mr-1" />
              {premiumSubscriptions} Premium
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Affiliate Clicks</CardTitle>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.affiliateStats._sum.clicks || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats.affiliateStats._sum.conversions || 0} conversions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.adStats._sum.impressions || 0}</div>
          <p className="text-xs text-muted-foreground">{stats.adStats._sum.clicks || 0} clicks</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AffiliateLinksTable({ links }: { links: any[] }) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Top Performing Affiliate Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {links.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No affiliate links found</p>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{link.name}</h3>
                  <p className="text-sm text-muted-foreground">{link.program}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>{link.clicks} clicks</span>
                    <span>{link.conversions} conversions</span>
                    <span>{formatCurrency(link.revenue * 100)}</span>
                  </div>
                </div>
                <Badge variant={link.isActive ? 'default' : 'secondary'}>
                  {link.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueTable({ revenue }: { revenue: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {revenue.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No revenue records found</p>
          ) : (
            revenue.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {record.type}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(record.amount, record.currency)}
                    </span>
                  </div>
                  {record.description && (
                    <p className="text-xs text-muted-foreground mt-1">{record.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(record.recordedAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

async function MonetizationData() {
  const stats = await getMonetizationStats();

  return (
    <div className="space-y-6">
      <RevenueOverview stats={stats} />
      <AffiliateLinksTable links={stats.topAffiliateLinks} />
      <RevenueTable revenue={stats.recentRevenue} />
    </div>
  );
}

export default function MonetizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Monetization Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track revenue streams and subscription metrics
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Subscriptions
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <MonetizationData />
      </Suspense>
    </div>
  );
}
