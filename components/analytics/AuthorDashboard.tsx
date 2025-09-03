'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Eye, 
  Clock, 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar,
  BarChart3,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthorDashboardProps {
  authorId: string;
  timeframe?: '24h' | '7d' | '30d' | '90d';
}

interface AuthorStats {
  totalViews: number;
  totalUniqueVisitors: number;
  avgReadTime: number;
  totalEngagementScore: number;
  totalArticles: number;
  publishedArticles: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
  followerCount: number;
  viewsChange: number;
  engagementChange: number;
  topPerformingArticles: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    engagementScore: number;
    publishedAt: string;
    trendingScore?: number;
  }>;
  recentArticles: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    comments: number;
    likes: number;
    publishedAt: string;
    status: 'PUBLISHED' | 'DRAFT';
  }>;
  engagementByTime: Array<{
    hour: number;
    views: number;
    engagements: number;
  }>;
  performanceMetrics: {
    avgViewsPerArticle: number;
    avgEngagementRate: number;
    avgShareRate: number;
    avgCommentRate: number;
    bestPerformingCategory?: string;
  };
}

export function AuthorDashboard({ authorId, timeframe = '30d' }: AuthorDashboardProps) {
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchAuthorStats();
  }, [authorId, timeframe]);

  const fetchAuthorStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/author/${authorId}?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch author stats');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading dashboard: {error}</p>
          <Button onClick={fetchAuthorStats} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const overviewCards = [
    {
      title: 'Total Views',
      value: formatNumber(stats.totalViews),
      change: stats.viewsChange,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Unique Visitors',
      value: formatNumber(stats.totalUniqueVisitors),
      change: 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Avg Read Time',
      value: formatDuration(Math.round(stats.avgReadTime)),
      change: 0,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Engagement Score',
      value: `${Math.round(stats.totalEngagementScore)}%`,
      change: stats.engagementChange,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Author Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{stats.publishedArticles} Published</Badge>
          <Badge variant="outline">{stats.totalArticles - stats.publishedArticles} Drafts</Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                {card.change !== 0 && (
                  <div className="flex items-center space-x-1">
                    {getChangeIcon(card.change)}
                    <span className={`text-sm ${getChangeColor(card.change)}`}>
                      {Math.abs(card.change)}%
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Views per Article</span>
                  <span className="font-semibold">
                    {formatNumber(stats.performanceMetrics.avgViewsPerArticle)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-semibold">
                    {(stats.performanceMetrics.avgEngagementRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Share Rate</span>
                  <span className="font-semibold">
                    {(stats.performanceMetrics.avgShareRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Comment Rate</span>
                  <span className="font-semibold">
                    {(stats.performanceMetrics.avgCommentRate * 100).toFixed(1)}%
                  </span>
                </div>
                {stats.performanceMetrics.bestPerformingCategory && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-600">Best Category:</span>
                    <Badge className="ml-2">
                      {stats.performanceMetrics.bestPerformingCategory}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Recent Articles
              </h3>
              <div className="space-y-3">
                {stats.recentArticles.slice(0, 5).map((article) => (
                  <div key={article.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {article.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={article.status === 'PUBLISHED' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {article.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>{formatNumber(article.views)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Top Performing Articles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-600">Article</th>
                    <th className="text-center py-3 font-medium text-gray-600">Views</th>
                    <th className="text-center py-3 font-medium text-gray-600">Engagement</th>
                    <th className="text-center py-3 font-medium text-gray-600">Published</th>
                    <th className="text-center py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topPerformingArticles.map((article) => (
                    <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-gray-900 mb-1">{article.title}</p>
                          <p className="text-sm text-gray-500">/articles/{article.slug}</p>
                        </div>
                      </td>
                      <td className="text-center py-4">
                        <div className="flex items-center justify-center space-x-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span>{formatNumber(article.views)}</span>
                        </div>
                      </td>
                      <td className="text-center py-4">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-semibold">
                              {Math.round(article.engagementScore)}%
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, article.engagementScore)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-4 text-sm text-gray-600">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="text-center py-4">
                        {article.trendingScore && article.trendingScore > 0 ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        ) : (
                          <Badge variant="outline">Published</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalLikes)}</div>
              <div className="text-sm text-gray-500">Total Likes</div>
            </Card>
            <Card className="p-4 text-center">
              <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalComments)}</div>
              <div className="text-sm text-gray-500">Total Comments</div>
            </Card>
            <Card className="p-4 text-center">
              <Share2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalShares)}</div>
              <div className="text-sm text-gray-500">Total Shares</div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Engagement by Time of Day</h3>
            <div className="space-y-2">
              {stats.engagementByTime.map((timeData) => (
                <div key={timeData.hour} className="flex items-center space-x-4">
                  <div className="w-12 text-sm text-gray-600 text-right">
                    {timeData.hour}:00
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(5, (timeData.engagements / Math.max(...stats.engagementByTime.map(t => t.engagements))) * 100)}%`
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        {timeData.engagements}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}