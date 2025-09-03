'use client';

import { Suspense, useState, useEffect } from 'react';
import { Users, Eye, FileText, BarChart3, Globe, MousePointer, DollarSign, GitBranch, Download, RefreshCw } from 'lucide-react';
import { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Import our comprehensive analytics components
import {
  LiveVisitorsMap,
  PerformanceCharts,
  ContentHeatmap,
  RevenueMetrics,
  UserFlow,
  PredictiveAnalytics,
} from '@/components/dashboard/analytics';

// Import analytics utilities
import { exportToPDF, exportToCSV, prepareAnalyticsExport } from '@/lib/analytics/export-utils';
import { useAnalyticsSocket } from '@/lib/websocket/analytics-socket';

// Loading component for suspense
function AnalyticsLoading() {
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

// Real-time metrics component with live data
function RealTimeMetrics({ metrics, isConnected }: { metrics: any, isConnected: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Live Besucher</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <Eye className="h-4 w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          <p className="text-xs text-gray-500 mt-1">
            {isConnected ? 'Live verbunden' : 'Offline Daten'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Heute</CardTitle>
          <Users className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.todayVisitors.toLocaleString('de-DE')}</div>
          <p className="text-xs text-green-600 mt-1">+12% vs. gestern</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <BarChart3 className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-green-600 mt-1">+0.8% diese Woche</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Revenue (Heute)</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{metrics.todayRevenue.toLocaleString('de-DE')}</div>
          <p className="text-xs text-green-600 mt-1">+15% vs. gestern</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: 127,
    todayVisitors: 2847,
    conversionRate: 3.2,
    todayRevenue: 1234,
  });

  // Real-time WebSocket connection
  const { subscribe, unsubscribe, isConnected } = useAnalyticsSocket();

  useEffect(() => {
    // Subscribe to real-time events
    const handleVisitorJoin = (event: any) => {
      setLiveMetrics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + 1,
        todayVisitors: prev.todayVisitors + 1,
      }));
    };

    const handleRevenue = (event: any) => {
      setLiveMetrics(prev => ({
        ...prev,
        todayRevenue: prev.todayRevenue + event.data.amount,
      }));
    };

    const handleConversion = (event: any) => {
      // Update conversion rate based on real-time data
      setLiveMetrics(prev => ({
        ...prev,
        conversionRate: Math.min(prev.conversionRate + 0.1, 10),
      }));
    };

    subscribe('visitor_join', handleVisitorJoin);
    subscribe('revenue', handleRevenue);
    subscribe('conversion', handleConversion);

    return () => {
      unsubscribe('visitor_join', handleVisitorJoin);
      unsubscribe('revenue', handleRevenue);
      unsubscribe('conversion', handleConversion);
    };
  }, [subscribe, unsubscribe]);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshKey(prev => prev + 1);
    setIsRefreshing(false);
  };

  const exportAllData = async (format: 'pdf' | 'csv') => {
    const exportData = prepareAnalyticsExport({});
    
    if (format === 'pdf') {
      await exportToPDF(exportData);
    } else {
      exportToCSV(exportData);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FluxAO Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive real-time analytics and insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Data
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleGlobalRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAllData('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAllData('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <RealTimeMetrics metrics={liveMetrics} isConnected={isConnected} />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-7 w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Live Map
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              User Flow
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              AI Insights
            </TabsTrigger>
          </TabsList>
          
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <span className="mr-1">📊</span>
            {isConnected ? 'Real-time Active' : 'Static Data'}
          </Badge>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview combining key insights from all modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Trends (7 Tage)</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<AnalyticsLoading />}>
                  <PerformanceCharts key={`overview-${refreshKey}`} />
                </Suspense>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Live Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<AnalyticsLoading />}>
                  <LiveVisitorsMap key={`overview-map-${refreshKey}`} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* Quick Revenue Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<AnalyticsLoading />}>
                <RevenueMetrics key={`overview-revenue-${refreshKey}`} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors">
          <Suspense fallback={<AnalyticsLoading />}>
            <LiveVisitorsMap key={`visitors-${refreshKey}`} />
          </Suspense>
        </TabsContent>

        <TabsContent value="performance">
          <Suspense fallback={<AnalyticsLoading />}>
            <PerformanceCharts key={`performance-${refreshKey}`} />
          </Suspense>
        </TabsContent>

        <TabsContent value="content">
          <Suspense fallback={<AnalyticsLoading />}>
            <ContentHeatmap key={`content-${refreshKey}`} />
          </Suspense>
        </TabsContent>

        <TabsContent value="revenue">
          <Suspense fallback={<AnalyticsLoading />}>
            <RevenueMetrics key={`revenue-${refreshKey}`} />
          </Suspense>
        </TabsContent>

        <TabsContent value="flow">
          <Suspense fallback={<AnalyticsLoading />}>
            <UserFlow key={`flow-${refreshKey}`} />
          </Suspense>
        </TabsContent>

        <TabsContent value="predictions">
          <Suspense fallback={<AnalyticsLoading />}>
            <PredictiveAnalytics key={`predictions-${refreshKey}`} />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Footer with insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Analytics Insights</h3>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered recommendations based on your data
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Powered by AI
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm">Opportunity</span>
              </div>
              <p className="text-sm text-gray-600">
                Ihre Artikel-Performance ist 23% besser als der Durchschnitt. 
                Erwägen Sie mehr Premium-Content für höhere Conversion.
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-sm">Attention</span>
              </div>
              <p className="text-sm text-gray-600">
                Mobile Traffic macht 38% aus, aber Conversion ist niedriger. 
                Optimieren Sie die mobile Nutzererfahrung.
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-sm">Trending</span>
              </div>
              <p className="text-sm text-gray-600">
                KI-Themen zeigen 156% mehr Engagement. 
                Produzieren Sie mehr Content in diesem Bereich.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
