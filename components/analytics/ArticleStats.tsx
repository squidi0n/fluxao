'use client';

import { useState, useEffect } from 'react';
import { Eye, Clock, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

interface ArticleStatsProps {
  postId: string;
  slug: string;
  showDetailed?: boolean;
  className?: string;
}

interface ArticleStatsData {
  views: number;
  uniqueVisitors: number;
  avgReadTime: number;
  bounceRate: number;
  scrollDepth: number;
  engagementScore: number;
  shareCount: number;
  commentCount: number;
  likeCount: number;
  dislikeCount: number;
  isCurrentlyTrending: boolean;
  trendingScore?: number;
  peakTrafficHour?: number;
}

export function ArticleStats({ postId, slug, showDetailed = false, className }: ArticleStatsProps) {
  const [stats, setStats] = useState<ArticleStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [postId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/analytics/article/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            {stats?.isCurrentlyTrending && (
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-red-600 text-sm">
          Failed to load analytics: {error}
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const basicStats = [
    {
      icon: Eye,
      label: 'Views',
      value: formatNumber(stats.views),
      detail: `${formatNumber(stats.uniqueVisitors)} unique`,
    },
    {
      icon: Clock,
      label: 'Avg Read Time',
      value: formatDuration(Math.round(stats.avgReadTime)),
      detail: `${Math.round(stats.scrollDepth)}% scroll`,
    },
    {
      icon: Heart,
      label: 'Engagement',
      value: `${Math.round(stats.engagementScore)}%`,
      detail: `${Math.round((1 - stats.bounceRate) * 100)}% stayed`,
    },
    {
      icon: Share2,
      label: 'Shares',
      value: formatNumber(stats.shareCount),
      detail: `${formatNumber(stats.commentCount)} comments`,
    },
  ];

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Article Performance</h3>
        {stats.isCurrentlyTrending && (
          <Badge className="bg-orange-100 text-orange-800">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {basicStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <div className="font-semibold text-lg text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.detail}</div>
            </div>
          );
        })}
      </div>

      {showDetailed && (
        <>
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Engagement Score</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, stats.engagementScore)}%` }}
                    ></div>
                  </div>
                  <span 
                    className={`text-sm px-2 py-1 rounded-full ${getEngagementColor(stats.engagementScore)}`}
                  >
                    {Math.round(stats.engagementScore)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">User Feedback</div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{stats.likeCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500 transform rotate-180" />
                    <span className="text-sm">{stats.dislikeCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{stats.commentCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {stats.trendingScore && stats.trendingScore > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Trending Score</div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-lg font-semibold text-orange-600">
                    {stats.trendingScore.toFixed(1)}
                  </span>
                  {stats.peakTrafficHour !== undefined && (
                    <span className="text-sm text-gray-500 ml-auto">
                      Peak: {stats.peakTrafficHour}:00
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="text-xs text-gray-400 mt-4 text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </Card>
  );
}