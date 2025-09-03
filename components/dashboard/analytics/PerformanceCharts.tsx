'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Clock,
  Mouse,
  Activity,
  Download,
} from 'lucide-react';

interface MetricData {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  engagementRate: number;
}

interface ContentPerformance {
  title: string;
  views: number;
  shares: number;
  comments: number;
  readTime: number;
  engagement: number;
}

interface DeviceData {
  name: string;
  value: number;
  color: string;
}

export default function PerformanceCharts() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [contentData, setContentData] = useState<ContentPerformance[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // No mock generators. Data is loaded from API if available.

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/performance/metrics');
        if (res.ok) {
          const payload = await res.json();
          const series = (payload.metrics || []).map((m: any) => ({
            date: new Date(m.timestamp).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
            pageViews: Math.round((m.throughput || 0) * 60 * 60 * 24),
            uniqueVisitors: Math.round((m.uniqueVisitors || 0)),
            avgSessionDuration: m.avgSessionDuration || 0,
            bounceRate: m.bounceRate || 0,
            engagementRate: m.engagementRate || 0,
          }));
          setMetricsData(series);
          setContentData([]);
          setDeviceData([]);
        } else {
          setMetricsData([]);
          setContentData([]);
          setDeviceData([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  const calculateTrend = (data: MetricData[], key: keyof MetricData) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7).reduce((sum, item) => sum + Number(item[key]), 0) / 7;
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + Number(item[key]), 0) / 7;
    return ((recent - previous) / previous) * 100;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const exportData = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = metricsData.map(row => Object.values(row).join(',')).join('\\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}.csv`;
      a.click();
    }
    // PDF export would require additional library like jsPDF
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
    );
  }

  const pageViewsTrend = calculateTrend(metricsData, 'pageViews');
  const visitorsTrend = calculateTrend(metricsData, 'uniqueVisitors');
  const engagementTrend = calculateTrend(metricsData, 'engagementRate');

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Analytics</h2>
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <TabsList>
              <TabsTrigger value="7d">7 Tage</TabsTrigger>
              <TabsTrigger value="30d">30 Tage</TabsTrigger>
              <TabsTrigger value="90d">90 Tage</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportData('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportData('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Seitenaufrufe</p>
                <p className="text-2xl font-bold">
                  {formatNumber(metricsData.reduce((sum, day) => sum + day.pageViews, 0))}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              {pageViewsTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${pageViewsTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(pageViewsTrend).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs. vorherige Periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold">
                  {formatNumber(metricsData.reduce((sum, day) => sum + day.uniqueVisitors, 0))}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              {visitorsTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${visitorsTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(visitorsTrend).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ø Session Dauer</p>
                <p className="text-2xl font-bold">
                  {Math.round(metricsData.reduce((sum, day) => sum + day.avgSessionDuration, 0) / metricsData.length / 60)}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-gray-600">Engagement hoch</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold">
                  {(metricsData.reduce((sum, day) => sum + day.engagementRate, 0) / metricsData.length).toFixed(1)}%
                </p>
              </div>
              <Mouse className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2">
              {engagementTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${engagementTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(engagementTrend).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="pageViews"
                fill="#3b82f6"
                fillOpacity={0.2}
                stroke="#3b82f6"
                strokeWidth={2}
                name="Seitenaufrufe"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="uniqueVisitors"
                stroke="#10b981"
                strokeWidth={3}
                name="Unique Visitors"
                dot={{ r: 4 }}
              />
              <Bar
                yAxisId="right"
                dataKey="engagementRate"
                fill="#f59e0b"
                opacity={0.7}
                name="Engagement Rate (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Content Performance & Device Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Content */}
        <Card>
          <CardHeader>
            <CardTitle>Top Content Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentData.map((content, index) => (
                <div key={content.title} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm flex-1 mr-2">{content.title}</h4>
                    <Badge variant={content.engagement > 80 ? 'default' : 'secondary'}>
                      {content.engagement}% Engagement
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(content.views)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {content.shares} Shares
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {content.comments}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {content.readTime}min
                    </div>
                  </div>
                  
                  {/* Engagement bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${content.engagement}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geräte-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {deviceData.map((device) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: device.color }}
                    ></div>
                    <span className="text-sm font-medium">{device.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{device.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bounce Rate & Session Duration */}
      <Card>
        <CardHeader>
          <CardTitle>User Behavior Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="bounceRate"
                stroke="#ef4444"
                strokeWidth={2}
                name="Bounce Rate (%)"
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgSessionDuration"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Ø Session Dauer (s)"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
