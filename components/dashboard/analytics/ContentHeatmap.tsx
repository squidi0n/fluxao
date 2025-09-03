'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Thermometer,
  MousePointer,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  ChevronDown,
  Filter,
  TrendingUp,
} from 'lucide-react';

interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  type: 'click' | 'hover' | 'scroll' | 'share';
  element: string;
  timestamp: Date;
}

interface ContentSection {
  id: string;
  title: string;
  type: 'headline' | 'paragraph' | 'image' | 'cta' | 'social';
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  avgTimeSpent: number;
  scrollDepth: number;
}

interface EngagementMetrics {
  totalClicks: number;
  avgScrollDepth: number;
  avgTimeOnPage: number;
  exitRate: number;
  socialShares: number;
  comments: number;
}

export default function ContentHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [selectedArticle, setSelectedArticle] = useState('ai-revolution-2024');
  const [heatmapType, setHeatmapType] = useState<'clicks' | 'attention' | 'engagement'>('clicks');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const articleOptions = [
    { id: 'ai-revolution-2024', title: 'KI Revolution: Was 2024 bringt' },
    { id: 'startup-trends', title: 'Startup Trends Deutschland' },
    { id: 'tech-investment', title: 'Tech Investment Guide' },
    { id: 'blockchain-future', title: 'Blockchain Beyond Crypto' },
  ];

  // Generate mock heatmap data
  const generateHeatmapData = (): HeatmapPoint[] => {
    const points: HeatmapPoint[] = [];
    
    // Simulate click hotspots
    for (let i = 0; i < 150; i++) {
      points.push({
        x: Math.random() * 800,
        y: Math.random() * 1200,
        intensity: Math.random() * 100,
        type: ['click', 'hover', 'scroll', 'share'][Math.floor(Math.random() * 4)] as any,
        element: ['headline', 'paragraph', 'image', 'button', 'link'][Math.floor(Math.random() * 5)],
        timestamp: new Date(Date.now() - Math.random() * 86400000),
      });
    }
    
    return points;
  };

  const generateContentSections = (): ContentSection[] => {
    return [
      {
        id: 'hero',
        title: 'Hero Section',
        type: 'headline',
        position: 0,
        clicks: 234,
        impressions: 1250,
        ctr: 18.7,
        avgTimeSpent: 5.2,
        scrollDepth: 98,
      },
      {
        id: 'intro',
        title: 'Introduction Paragraph',
        type: 'paragraph',
        position: 1,
        clicks: 89,
        impressions: 1150,
        ctr: 7.7,
        avgTimeSpent: 12.4,
        scrollDepth: 85,
      },
      {
        id: 'main-image',
        title: 'Featured Image',
        type: 'image',
        position: 2,
        clicks: 156,
        impressions: 980,
        ctr: 15.9,
        avgTimeSpent: 3.1,
        scrollDepth: 78,
      },
      {
        id: 'section1',
        title: 'Section 1: AI Trends',
        type: 'paragraph',
        position: 3,
        clicks: 67,
        impressions: 856,
        ctr: 7.8,
        avgTimeSpent: 18.2,
        scrollDepth: 65,
      },
      {
        id: 'cta-newsletter',
        title: 'Newsletter CTA',
        type: 'cta',
        position: 4,
        clicks: 134,
        impressions: 723,
        ctr: 18.5,
        avgTimeSpent: 2.8,
        scrollDepth: 52,
      },
      {
        id: 'section2',
        title: 'Section 2: Implementation',
        type: 'paragraph',
        position: 5,
        clicks: 45,
        impressions: 654,
        ctr: 6.9,
        avgTimeSpent: 22.1,
        scrollDepth: 48,
      },
      {
        id: 'social-share',
        title: 'Social Share Buttons',
        type: 'social',
        position: 6,
        clicks: 89,
        impressions: 543,
        ctr: 16.4,
        avgTimeSpent: 1.2,
        scrollDepth: 35,
      },
    ];
  };

  const generateEngagementMetrics = (): EngagementMetrics => {
    return {
      totalClicks: 814,
      avgScrollDepth: 67.8,
      avgTimeOnPage: 245,
      exitRate: 34.5,
      socialShares: 156,
      comments: 23,
    };
  };

  // Draw heatmap on canvas
  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter points based on type
    const filteredPoints = heatmapData.filter(point => {
      switch (heatmapType) {
        case 'clicks':
          return point.type === 'click';
        case 'attention':
          return point.type === 'hover';
        case 'engagement':
          return point.type === 'share' || point.type === 'click';
        default:
          return true;
      }
    });

    // Draw heatmap points
    filteredPoints.forEach(point => {
      const radius = 15 + (point.intensity / 100) * 25;
      const alpha = 0.1 + (point.intensity / 100) * 0.4;

      // Create radial gradient
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      
      if (heatmapType === 'clicks') {
        gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (heatmapType === 'attention') {
        gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else {
        gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analytics/heatmap?article=${encodeURIComponent(selectedArticle)}`);
        if (res.ok) {
          const payload = await res.json();
          setHeatmapData(payload.points || []);
          setContentSections(payload.sections || []);
          setEngagementMetrics(payload.metrics || null);
        } else {
          setHeatmapData([]);
          setContentSections([]);
          setEngagementMetrics(null);
        }
      } catch {
        setHeatmapData([]);
        setContentSections([]);
        setEngagementMetrics(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedArticle]);

  useEffect(() => {
    if (!isLoading && heatmapData.length > 0) {
      drawHeatmap();
    }
  }, [heatmapData, heatmapType, isLoading]);

  const getIntensityColor = (ctr: number) => {
    if (ctr >= 15) return 'text-red-600 bg-red-100';
    if (ctr >= 10) return 'text-orange-600 bg-orange-100';
    if (ctr >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getEngagementLevel = (scrollDepth: number) => {
    if (scrollDepth >= 80) return { label: 'Hoch', color: 'bg-green-500' };
    if (scrollDepth >= 50) return { label: 'Mittel', color: 'bg-yellow-500' };
    return { label: 'Niedrig', color: 'bg-red-500' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Heatmap Analysis</h2>
        
        <div className="flex items-center gap-4">
          {/* Article Selector */}
          <select
            value={selectedArticle}
            onChange={(e) => setSelectedArticle(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            {articleOptions.map(article => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>

          {/* Heatmap Type Tabs */}
          <Tabs value={heatmapType} onValueChange={(value: any) => setHeatmapType(value)}>
            <TabsList>
              <TabsTrigger value="clicks">Clicks</TabsTrigger>
              <TabsTrigger value="attention">Attention</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Key Metrics */}
      {engagementMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <MousePointer className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{engagementMetrics.totalClicks}</p>
                <p className="text-xs text-gray-600">Total Clicks</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <ChevronDown className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{engagementMetrics.avgScrollDepth}%</p>
                <p className="text-xs text-gray-600">Scroll Depth</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <Eye className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{Math.round(engagementMetrics.avgTimeOnPage / 60)}m</p>
                <p className="text-xs text-gray-600">Avg. Time</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{engagementMetrics.exitRate}%</p>
                <p className="text-xs text-gray-600">Exit Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <Share2 className="h-6 w-6 text-pink-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{engagementMetrics.socialShares}</p>
                <p className="text-xs text-gray-600">Shares</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <MessageCircle className="h-6 w-6 text-indigo-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{engagementMetrics.comments}</p>
                <p className="text-xs text-gray-600">Comments</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Visual Heatmap - {heatmapType.charAt(0).toUpperCase() + heatmapType.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-64 border rounded"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded opacity-60"></div>
                  <span>High Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded opacity-60"></div>
                  <span>Medium Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded opacity-60"></div>
                  <span>Low Activity</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Sections Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Section Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentSections.map((section, index) => {
                const engagement = getEngagementLevel(section.scrollDepth);
                return (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <h4 className="font-medium">{section.title}</h4>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`${getIntensityColor(section.ctr)} border-0`}
                      >
                        {section.ctr}% CTR
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Clicks</p>
                        <p className="font-medium">{section.clicks}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Impressions</p>
                        <p className="font-medium">{section.impressions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Time Spent</p>
                        <p className="font-medium">{section.avgTimeSpent}s</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Engagement</p>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${engagement.color}`}></div>
                          <span className="text-xs font-medium">{engagement.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Scroll Depth</span>
                        <span>{section.scrollDepth}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${section.scrollDepth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Interaction Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {heatmapData.slice(0, 10).map((point, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    point.type === 'click' ? 'bg-red-500' :
                    point.type === 'hover' ? 'bg-blue-500' :
                    point.type === 'scroll' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div>
                    <p className="font-medium capitalize">{point.type} on {point.element}</p>
                    <p className="text-xs text-gray-600">
                      {point.timestamp.toLocaleTimeString('de-DE')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Position: {Math.round(point.x)}, {Math.round(point.y)}</p>
                  <p className="text-xs text-gray-600">Intensity: {Math.round(point.intensity)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
