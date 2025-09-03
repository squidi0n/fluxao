'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Users,
  FileText,
  Mail,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Play,
  Pause,
} from 'lucide-react';

interface AIStatus {
  enabled: boolean;
  usage: {
    used: number;
    limit: number;
    percentage: number;
    remaining: number;
  };
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface DashboardData {
  overview: {
    totalPosts: number;
    totalUsers: number;
    totalComments: number;
    pendingModeration: number;
    recentActivity: number;
  };
  recommendations: string[];
}

interface JobStatus {
  id: string;
  type: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AIAutomationDashboard() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statusRes, dashboardRes] = await Promise.all([
        fetch('/api/ai/admin?action=status'),
        fetch('/api/ai/admin?action=dashboard-data'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setAiStatus(statusData.ai);
        setQueueStats(statusData.queue);
      }

      if (dashboardRes.ok) {
        const dashboard = await dashboardRes.json();
        setDashboardData(dashboard);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeTask = async (action: string, payload: any = {}) => {
    try {
      const response = await fetch(`/api/ai/admin?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, async: true }),
      });

      if (response.ok) {
        const { jobId } = await response.json();
        // Add job to recent jobs list
        setRecentJobs(prev => [
          {
            id: jobId,
            type: action,
            status: 'waiting',
            progress: 0,
            createdAt: new Date(),
          },
          ...prev.slice(0, 9), // Keep only last 10 jobs
        ]);
        
        // Poll for job status
        pollJobStatus(jobId);
      }
    } catch (error) {
      console.error('Failed to execute task:', error);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/admin?jobId=${jobId}`);
        if (response.ok) {
          const status = await response.json();
          
          setRecentJobs(prev => prev.map(job => 
            job.id === jobId ? { ...job, ...status } : job
          ));
          
          if (status.status === 'completed' || status.status === 'failed') {
            return; // Stop polling
          }
          
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    };
    
    poll();
  };

  const queueChartData = queueStats ? [
    { name: 'Waiting', value: queueStats.waiting, color: '#FFBB28' },
    { name: 'Active', value: queueStats.active, color: '#0088FE' },
    { name: 'Completed', value: queueStats.completed, color: '#00C49F' },
    { name: 'Failed', value: queueStats.failed, color: '#FF8042' },
    { name: 'Delayed', value: queueStats.delayed, color: '#8884D8' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8" />
        <span className="ml-2">Loading AI Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Automation Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor AI-powered content automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={aiStatus?.enabled ? 'default' : 'secondary'}>
            {aiStatus?.enabled ? 'AI Enabled' : 'AI Disabled'}
          </Badge>
          <Button onClick={loadDashboardData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Token Usage</p>
              <p className="text-2xl font-bold">
                {aiStatus?.usage.used || 0}
                <span className="text-sm text-gray-500 ml-1">
                  / {aiStatus?.usage.limit || 0}
                </span>
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
          <Progress 
            value={aiStatus?.usage.percentage || 0} 
            className="mt-3"
          />
          <p className="text-xs text-gray-500 mt-1">
            {aiStatus?.usage.percentage || 0}% used this month
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold">{queueStats?.active || 0}</p>
            </div>
            <Play className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {queueStats?.waiting || 0} waiting
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold">{queueStats?.completed || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {queueStats?.failed || 0} failed
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Content Generated</p>
              <p className="text-2xl font-bold">{dashboardData?.overview.totalPosts || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Status Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Job Queue Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={queueChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {queueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => executeTask('content-audit', { options: { timeframe: 'week' } })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Run Content Audit
                </Button>
                <Button
                  onClick={() => executeTask('engagement-insights', { timeframe: 'week' })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Analyze User Engagement
                </Button>
                <Button
                  onClick={() => executeTask('moderation-report', { timeframe: 'week' })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Generate Moderation Report
                </Button>
                <Button
                  onClick={() => executeTask('automated-report', { reportType: 'weekly' })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Create Weekly Report
                </Button>
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          {dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
              <div className="space-y-2">
                {dashboardData.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Generation</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => executeTask('content-audit', { 
                    options: { 
                      focusAreas: ['SEO', 'QUALITY'],
                      timeframe: 'month'
                    }
                  })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  SEO & Quality Audit
                </Button>
                <Button
                  onClick={() => window.open('/admin/ai/content-ideas', '_blank')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Content Ideas
                </Button>
                <Button
                  onClick={() => executeTask('content-strategy', { 
                    businessGoals: ['Increase traffic', 'Improve engagement', 'Generate leads']
                  })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Update Content Strategy
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Posts</span>
                  <span className="font-semibold">{dashboardData?.overview.totalPosts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Moderation</span>
                  <span className="font-semibold">{dashboardData?.overview.pendingModeration || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recent Activity</span>
                  <span className="font-semibold">{dashboardData?.overview.recentActivity || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analytics & Insights</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => executeTask('analytics-insights', { timeframe: 'week' })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Weekly Analytics Report
                </Button>
                <Button
                  onClick={() => executeTask('engagement-insights', { timeframe: 'month' })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  User Engagement Analysis
                </Button>
                <Button
                  onClick={() => executeTask('automated-report', { reportType: 'monthly' })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Monthly Performance Report
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Predictive Insights</h3>
              <p className="text-sm text-gray-600 mb-4">
                AI-powered predictions and trend analysis
              </p>
              <Button
                onClick={() => executeTask('generate-alerts')}
                className="w-full"
                variant="outline"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Generate AI Alerts
              </Button>
            </Card>
          </div>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Moderation</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => executeTask('moderation-report', { timeframe: 'week' })}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Weekly Moderation Report
                </Button>
                <Button
                  onClick={() => window.open('/admin/comments', '_blank')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Review Pending Comments
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Moderation Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Review</span>
                  <Badge variant="outline">{dashboardData?.overview.pendingModeration || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Auto-Approved Today</span>
                  <Badge variant="outline">-</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Spam Blocked</span>
                  <Badge variant="outline">-</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent AI Jobs</h3>
              <Button onClick={loadDashboardData} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {recentJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent jobs</p>
              ) : (
                recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {job.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {job.status === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {job.status === 'active' && (
                          <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                        {job.status === 'waiting' && (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{job.type.replace('-', ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {job.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        job.status === 'completed' ? 'default' :
                        job.status === 'failed' ? 'destructive' :
                        job.status === 'active' ? 'secondary' : 'outline'
                      }>
                        {job.status}
                      </Badge>
                      {job.status === 'active' && (
                        <Progress value={job.progress} className="w-20" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}