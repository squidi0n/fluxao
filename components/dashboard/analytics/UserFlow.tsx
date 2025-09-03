'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  ArrowDown,
  Users,
  Eye,
  MousePointer,
  ExternalLink,
  Home,
  FileText,
  ShoppingCart,
  UserPlus,
  LogOut,
  Search,
  Heart,
  Share2,
  MessageCircle,
} from 'lucide-react';

interface FlowStep {
  id: string;
  name: string;
  page: string;
  icon: any;
  users: number;
  dropOff: number;
  avgTimeSpent: number;
  actions: UserAction[];
  nextSteps: FlowConnection[];
}

interface FlowConnection {
  toStepId: string;
  users: number;
  percentage: number;
  conversionRate?: number;
}

interface UserAction {
  type: 'click' | 'scroll' | 'share' | 'comment' | 'like';
  element: string;
  count: number;
  avgPosition: number;
}

interface UserSegment {
  name: string;
  users: number;
  color: string;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: string[];
}

interface PageAnalytics {
  page: string;
  visits: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
  topExitPages: string[];
}

export default function UserFlow() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [flowData, setFlowData] = useState<FlowStep[]>([]);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [pageAnalytics, setPageAnalytics] = useState<PageAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateFlowData = (): FlowStep[] => {
    return [
      {
        id: 'landing',
        name: 'Landing Page',
        page: '/',
        icon: Home,
        users: 15420,
        dropOff: 0,
        avgTimeSpent: 45,
        actions: [
          { type: 'click', element: 'Hero CTA', count: 2341, avgPosition: 20 },
          { type: 'scroll', element: 'Features Section', count: 8932, avgPosition: 45 },
          { type: 'click', element: 'Nav Menu', count: 1876, avgPosition: 12 },
        ],
        nextSteps: [
          { toStepId: 'article', users: 6234, percentage: 40.4, conversionRate: 40.4 },
          { toStepId: 'signup', users: 2876, percentage: 18.7, conversionRate: 18.7 },
          { toStepId: 'search', users: 1854, percentage: 12.0, conversionRate: 12.0 },
        ],
      },
      {
        id: 'article',
        name: 'Article View',
        page: '/articles/*',
        icon: FileText,
        users: 6234,
        dropOff: 59.6,
        avgTimeSpent: 180,
        actions: [
          { type: 'scroll', element: 'Article Content', count: 5123, avgPosition: 65 },
          { type: 'share', element: 'Share Button', count: 892, avgPosition: 85 },
          { type: 'like', element: 'Like Button', count: 1456, avgPosition: 90 },
          { type: 'comment', element: 'Comment Section', count: 234, avgPosition: 95 },
        ],
        nextSteps: [
          { toStepId: 'related', users: 2876, percentage: 46.1, conversionRate: 46.1 },
          { toStepId: 'signup', users: 1245, percentage: 20.0, conversionRate: 20.0 },
          { toStepId: 'newsletter', users: 934, percentage: 15.0, conversionRate: 15.0 },
        ],
      },
      {
        id: 'search',
        name: 'Search Results',
        page: '/search',
        icon: Search,
        users: 1854,
        dropOff: 88.0,
        avgTimeSpent: 95,
        actions: [
          { type: 'click', element: 'Search Filter', count: 456, avgPosition: 15 },
          { type: 'click', element: 'Result Item', count: 1234, avgPosition: 35 },
        ],
        nextSteps: [
          { toStepId: 'article', users: 1123, percentage: 60.6, conversionRate: 60.6 },
          { toStepId: 'landing', users: 234, percentage: 12.6, conversionRate: 12.6 },
        ],
      },
      {
        id: 'signup',
        name: 'Registration',
        page: '/auth/signup',
        icon: UserPlus,
        users: 4121,
        dropOff: 73.3,
        avgTimeSpent: 120,
        actions: [
          { type: 'click', element: 'Google Login', count: 1876, avgPosition: 25 },
          { type: 'click', element: 'Email Form', count: 1345, avgPosition: 40 },
          { type: 'click', element: 'Submit Button', count: 856, avgPosition: 85 },
        ],
        nextSteps: [
          { toStepId: 'onboarding', users: 856, percentage: 20.8, conversionRate: 20.8 },
          { toStepId: 'newsletter', users: 345, percentage: 8.4, conversionRate: 8.4 },
        ],
      },
      {
        id: 'onboarding',
        name: 'Onboarding',
        page: '/onboarding',
        icon: Users,
        users: 856,
        dropOff: 94.4,
        avgTimeSpent: 240,
        actions: [
          { type: 'click', element: 'Interest Selection', count: 678, avgPosition: 30 },
          { type: 'click', element: 'Skip Button', count: 123, avgPosition: 20 },
          { type: 'click', element: 'Complete Button', count: 543, avgPosition: 95 },
        ],
        nextSteps: [
          { toStepId: 'subscription', users: 543, percentage: 63.4, conversionRate: 63.4 },
          { toStepId: 'dashboard', users: 234, percentage: 27.3, conversionRate: 27.3 },
        ],
      },
      {
        id: 'subscription',
        name: 'Subscription',
        page: '/pricing',
        icon: ShoppingCart,
        users: 543,
        dropOff: 96.5,
        avgTimeSpent: 180,
        actions: [
          { type: 'click', element: 'Plan Selection', count: 432, avgPosition: 45 },
          { type: 'click', element: 'Payment Form', count: 234, avgPosition: 75 },
          { type: 'click', element: 'Subscribe Button', count: 156, avgPosition: 90 },
        ],
        nextSteps: [
          { toStepId: 'success', users: 156, percentage: 28.7, conversionRate: 28.7 },
        ],
      },
      {
        id: 'success',
        name: 'Success Page',
        page: '/success',
        icon: Heart,
        users: 156,
        dropOff: 99.0,
        avgTimeSpent: 60,
        actions: [
          { type: 'click', element: 'Dashboard Link', count: 134, avgPosition: 80 },
          { type: 'share', element: 'Social Share', count: 23, avgPosition: 90 },
        ],
        nextSteps: [],
      },
    ];
  };

  const generateUserSegments = (): UserSegment[] => {
    return [
      {
        name: 'Neue Besucher',
        users: 8934,
        color: '#3b82f6',
        avgSessionDuration: 120,
        bounceRate: 65.4,
        conversionRate: 2.3,
        topPages: ['/', '/articles/ai-trends', '/about'],
      },
      {
        name: 'Wiederkehrende Besucher',
        users: 4567,
        color: '#10b981',
        avgSessionDuration: 280,
        bounceRate: 35.2,
        conversionRate: 8.7,
        topPages: ['/articles/*', '/profile', '/dashboard'],
      },
      {
        name: 'Registrierte Nutzer',
        users: 1876,
        color: '#f59e0b',
        avgSessionDuration: 420,
        bounceRate: 18.9,
        conversionRate: 15.4,
        topPages: ['/dashboard', '/articles/*', '/profile'],
      },
      {
        name: 'Premium Abonnenten',
        users: 234,
        color: '#8b5cf6',
        avgSessionDuration: 650,
        bounceRate: 8.2,
        conversionRate: 45.6,
        topPages: ['/premium/*', '/dashboard', '/settings'],
      },
    ];
  };

  const generatePageAnalytics = (): PageAnalytics[] => {
    return [
      {
        page: '/',
        visits: 15420,
        uniqueVisitors: 12340,
        avgTimeOnPage: 45,
        bounceRate: 58.4,
        exitRate: 23.1,
        topExitPages: ['/articles/ai-trends', '/auth/signup', '/search'],
      },
      {
        page: '/articles/*',
        visits: 8765,
        uniqueVisitors: 7234,
        avgTimeOnPage: 180,
        bounceRate: 42.3,
        exitRate: 35.6,
        topExitPages: ['/', '/related-articles', '/auth/signup'],
      },
      {
        page: '/auth/signup',
        visits: 4121,
        uniqueVisitors: 3876,
        avgTimeOnPage: 120,
        bounceRate: 67.8,
        exitRate: 78.9,
        topExitPages: ['/', '/auth/login', '/pricing'],
      },
      {
        page: '/pricing',
        visits: 1234,
        uniqueVisitors: 1123,
        avgTimeOnPage: 180,
        bounceRate: 45.6,
        exitRate: 71.2,
        topExitPages: ['/', '/auth/signup', '/features'],
      },
    ];
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 700));
      
      setFlowData(generateFlowData());
      setUserSegments(generateUserSegments());
      setPageAnalytics(generatePageAnalytics());
      
      setIsLoading(false);
    };

    loadData();
  }, [selectedTimeframe, selectedSegment]);

  const getStepIcon = (IconComponent: any) => {
    return <IconComponent className="h-5 w-5" />;
  };

  const getDropOffColor = (dropOff: number) => {
    if (dropOff < 30) return 'text-green-600 bg-green-100';
    if (dropOff < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Journey Flow</h2>
        
        <div className="flex items-center gap-4">
          <Tabs value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7 Tage</TabsTrigger>
              <TabsTrigger value="30d">30 Tage</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">Alle Nutzer</option>
            <option value="new">Neue Besucher</option>
            <option value="returning">Wiederkehrende</option>
            <option value="registered">Registriert</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      {/* User Segments Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Nutzer-Segmente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {userSegments.map((segment) => (
              <div 
                key={segment.name}
                className="border rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => setSelectedSegment(segment.name.toLowerCase().replace(' ', ''))}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <h4 className="font-medium">{segment.name}</h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nutzer:</span>
                    <span className="font-medium">{segment.users.toLocaleString('de-DE')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ø Session:</span>
                    <span className="font-medium">{Math.round(segment.avgSessionDuration / 60)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bounce Rate:</span>
                    <span className="font-medium">{segment.bounceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion:</span>
                    <span className="font-medium text-green-600">{segment.conversionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Journey Flow Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {flowData.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Flow Step */}
                <div className="flex items-center gap-6">
                  {/* Step Info */}
                  <div className="flex-shrink-0 w-80">
                    <div className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {getStepIcon(step.icon)}
                        </div>
                        <div>
                          <h4 className="font-medium">{step.name}</h4>
                          <p className="text-sm text-gray-600">{step.page}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Nutzer</p>
                          <p className="font-bold text-lg">{step.users.toLocaleString('de-DE')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Ø Zeit</p>
                          <p className="font-medium">{Math.round(step.avgTimeSpent / 60)}m {step.avgTimeSpent % 60}s</p>
                        </div>
                      </div>
                      
                      {step.dropOff > 0 && (
                        <div className="mt-2">
                          <Badge 
                            variant="secondary"
                            className={getDropOffColor(step.dropOff)}
                          >
                            {step.dropOff}% Drop-off
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-1">
                    <h5 className="font-medium mb-2">Top Actions</h5>
                    <div className="space-y-2">
                      {step.actions.slice(0, 3).map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                          <span>{action.element}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {action.type}
                            </Badge>
                            <span className="font-medium">{action.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Connections to Next Steps */}
                {step.nextSteps.length > 0 && (
                  <div className="ml-40 mt-4 space-y-2">
                    {step.nextSteps.map((connection, connIndex) => {
                      const nextStep = flowData.find(s => s.id === connection.toStepId);
                      return (
                        <div key={connIndex} className="flex items-center gap-3">
                          <ArrowDown className="h-4 w-4 text-gray-400" />
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{connection.users.toLocaleString('de-DE')} Nutzer</span>
                            <Badge variant="secondary">
                              {connection.percentage}%
                            </Badge>
                            {nextStep && (
                              <span className="text-gray-600">→ {nextStep.name}</span>
                            )}
                          </div>
                          
                          {/* Visual flow bar */}
                          <div className="flex-1 max-w-xs">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${connection.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Seiten-Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pageAnalytics.map((page, index) => (
                <div key={page.page} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{page.page}</h4>
                      <p className="text-sm text-gray-600">
                        {page.visits.toLocaleString('de-DE')} Besuche
                      </p>
                    </div>
                    <Badge 
                      variant={page.bounceRate < 50 ? 'default' : 'secondary'}
                    >
                      {page.bounceRate}% Bounce
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Unique Visitors</p>
                      <p className="font-medium">{page.uniqueVisitors.toLocaleString('de-DE')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ø Zeit</p>
                      <p className="font-medium">{Math.round(page.avgTimeOnPage / 60)}m {page.avgTimeOnPage % 60}s</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Exit Rate</p>
                      <p className={`font-medium ${page.exitRate > 50 ? 'text-red-600' : 'text-green-600'}`}>
                        {page.exitRate}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Funnel Metrics */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium mb-2">Overall Conversion</h4>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {((156 / 15420) * 100).toFixed(2)}%
                </div>
                <p className="text-sm text-gray-600">
                  Von 15,420 Besuchern → 156 Abonnenten
                </p>
              </div>

              {/* Key Drop-off Points */}
              <div>
                <h5 className="font-medium mb-3">Kritische Drop-off Punkte</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm">Landing → Article</span>
                    <Badge variant="destructive">59.6% Drop-off</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="text-sm">Signup → Onboarding</span>
                    <Badge className="bg-yellow-500">79.2% Drop-off</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <span className="text-sm">Onboarding → Subscription</span>
                    <Badge className="bg-orange-500">63.4% Conversion</Badge>
                  </div>
                </div>
              </div>

              {/* Optimization Suggestions */}
              <div>
                <h5 className="font-medium mb-3">Optimierungsvorschläge</h5>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                    <span>Landing Page: Verbessere Hero-Section für mehr Article-Clicks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                    <span>Signup: Reduziere Formularfelder für höhere Conversion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>Onboarding: Vereinfache den Prozess für bessere Retention</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}