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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Target,
  ShoppingCart,
  Crown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface RevenueData {
  date: string;
  subscriptions: number;
  advertisements: number;
  premiumContent: number;
  donations: number;
  total: number;
  newSubscribers: number;
  churnRate: number;
}

interface SubscriptionTier {
  name: string;
  price: number;
  subscribers: number;
  revenue: number;
  retention: number;
  color: string;
}

interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate: number;
  revenue: number;
}

interface PaymentMethod {
  name: string;
  percentage: number;
  transactions: number;
  revenue: number;
  color: string;
}

export default function RevenueMetrics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateRevenueData = (days: number): RevenueData[] => {
    const data: RevenueData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const baseSubscriptions = 1500 + Math.random() * 300;
      const baseAds = 400 + Math.random() * 200;
      const basePremium = 800 + Math.random() * 400;
      const baseDonations = 100 + Math.random() * 150;
      
      data.push({
        date: date.toLocaleDateString('de-DE', { 
          month: 'short', 
          day: 'numeric',
          ...(days > 31 ? { year: '2-digit' } : {})
        }),
        subscriptions: Math.floor(baseSubscriptions),
        advertisements: Math.floor(baseAds),
        premiumContent: Math.floor(basePremium),
        donations: Math.floor(baseDonations),
        total: Math.floor(baseSubscriptions + baseAds + basePremium + baseDonations),
        newSubscribers: Math.floor(Math.random() * 50 + 20),
        churnRate: 2 + Math.random() * 3,
      });
    }
    
    return data;
  };

  const generateSubscriptionTiers = (): SubscriptionTier[] => {
    return [
      {
        name: 'Basic',
        price: 4.99,
        subscribers: 2845,
        revenue: 14200,
        retention: 87.5,
        color: '#3b82f6',
      },
      {
        name: 'Pro',
        price: 9.99,
        subscribers: 1654,
        revenue: 16522,
        retention: 92.1,
        color: '#10b981',
      },
      {
        name: 'Premium',
        price: 19.99,
        subscribers: 743,
        revenue: 14857,
        retention: 94.8,
        color: '#f59e0b',
      },
      {
        name: 'Enterprise',
        price: 49.99,
        subscribers: 128,
        revenue: 6399,
        retention: 97.2,
        color: '#8b5cf6',
      },
    ];
  };

  const generateConversionFunnel = (): ConversionFunnel[] => {
    return [
      {
        stage: 'Besucher',
        users: 15430,
        conversionRate: 100,
        revenue: 0,
      },
      {
        stage: 'Registriert',
        users: 3086,
        conversionRate: 20,
        revenue: 0,
      },
      {
        stage: 'Trial gestartet',
        users: 925,
        conversionRate: 30,
        revenue: 0,
      },
      {
        stage: 'Abonnement',
        users: 463,
        conversionRate: 50,
        revenue: 2315,
      },
      {
        stage: 'Premium Upgrade',
        users: 139,
        conversionRate: 30,
        revenue: 2780,
      },
    ];
  };

  const generatePaymentMethods = (): PaymentMethod[] => {
    return [
      {
        name: 'Kreditkarte',
        percentage: 45,
        transactions: 2035,
        revenue: 23450,
        color: '#3b82f6',
      },
      {
        name: 'PayPal',
        percentage: 32,
        transactions: 1447,
        revenue: 16734,
        color: '#10b981',
      },
      {
        name: 'SEPA',
        percentage: 18,
        transactions: 814,
        revenue: 9412,
        color: '#f59e0b',
      },
      {
        name: 'Andere',
        percentage: 5,
        transactions: 226,
        revenue: 2613,
        color: '#8b5cf6',
      },
    ];
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      setRevenueData(generateRevenueData(days));
      setSubscriptionTiers(generateSubscriptionTiers());
      setConversionFunnel(generateConversionFunnel());
      setPaymentMethods(generatePaymentMethods());
      
      setIsLoading(false);
    };

    loadData();
  }, [timeRange]);

  const calculateTrend = (data: RevenueData[], key: keyof RevenueData) => {
    if (data.length < 14) return 0;
    const recent = data.slice(-7).reduce((sum, item) => sum + Number(item[key]), 0) / 7;
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + Number(item[key]), 0) / 7;
    return ((recent - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const totalRevenue = revenueData.reduce((sum, day) => sum + day.total, 0);
  const totalSubscribers = subscriptionTiers.reduce((sum, tier) => sum + tier.subscribers, 0);
  const avgRevenue = totalRevenue / Math.max(revenueData.length, 1);
  const revenueGrowth = calculateTrend(revenueData, 'total');

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
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
        <h2 className="text-2xl font-bold">Revenue Analytics</h2>
        
        <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <TabsList>
            <TabsTrigger value="7d">7 Tage</TabsTrigger>
            <TabsTrigger value="30d">30 Tage</TabsTrigger>
            <TabsTrigger value="90d">90 Tage</TabsTrigger>
            <TabsTrigger value="12m">12 Monate</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              {revenueGrowth > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs. vorherige Periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ø Tageserlös</p>
                <p className="text-2xl font-bold">{formatCurrency(avgRevenue)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              <Target className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs text-gray-500">Durchschnitt pro Tag</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abonnenten</p>
                <p className="text-2xl font-bold">{totalSubscribers.toLocaleString('de-DE')}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              <Crown className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-xs text-gray-500">Aktive Abos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ARPU</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue / totalSubscribers)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2">
              <CreditCard className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-xs text-gray-500">Revenue per User</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Entwicklung</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: any, name: any) => {
                  if (name === 'churnRate') return [`${value}%`, name];
                  return [formatCurrency(Number(value)), name];
                }}
              />
              <Legend />
              
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="total"
                fill="#3b82f6"
                fillOpacity={0.2}
                stroke="#3b82f6"
                strokeWidth={3}
                name="Gesamtumsatz"
              />
              
              <Bar
                yAxisId="left"
                dataKey="subscriptions"
                fill="#10b981"
                name="Abonnements"
              />
              
              <Bar
                yAxisId="left"
                dataKey="advertisements"
                fill="#f59e0b"
                name="Werbung"
              />
              
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="churnRate"
                stroke="#ef4444"
                strokeWidth={2}
                name="Churn Rate (%)"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subscription Tiers & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Abonnement-Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionTiers.map((tier) => (
                <div key={tier.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tier.color }}
                      ></div>
                      <h4 className="font-medium">{tier.name}</h4>
                      <Badge variant="outline">{formatCurrency(tier.price)}/Monat</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{tier.subscribers.toLocaleString('de-DE')}</p>
                      <p className="text-xs text-gray-500">Abonnenten</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-medium">{formatCurrency(tier.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Retention</p>
                      <p className="font-medium text-green-600">{tier.retention}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Share</p>
                      <p className="font-medium">
                        {((tier.subscribers / totalSubscribers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Revenue bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(tier.revenue / Math.max(...subscriptionTiers.map(t => t.revenue))) * 100}%`,
                          backgroundColor: tier.color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={conversionFunnel}
                layout="horizontal"
                margin={{ left: 80, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="stage" />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'users') return [value.toLocaleString('de-DE'), 'Nutzer'];
                    return [formatCurrency(Number(value)), name];
                  }}
                />
                <Bar dataKey="users" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {conversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <div className="flex items-center gap-4">
                    <span>{stage.users.toLocaleString('de-DE')} Nutzer</span>
                    {index > 0 && (
                      <Badge variant="secondary">
                        {stage.conversionRate}% Conversion
                      </Badge>
                    )}
                    {stage.revenue > 0 && (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(stage.revenue)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Zahlungsmethoden</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: method.color }}
                    ></div>
                    <span className="font-medium">{method.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(method.revenue)}</p>
                    <p className="text-xs text-gray-500">
                      {method.transactions} Transaktionen
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Status & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Success Metrics */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-800">Umsatzziel erreicht</p>
                  <p className="text-sm text-green-600">
                    {((totalRevenue / 50000) * 100).toFixed(1)}% des Monatsziels
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-800">Erhöhte Churn Rate</p>
                  <p className="text-sm text-yellow-600">
                    3.2% diese Woche (+0.8% vs. letzte Woche)
                  </p>
                </div>
              </div>

              {/* Pending Actions */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-800">Rechnungen ausstehend</p>
                  <p className="text-sm text-blue-600">
                    23 Rechnungen im Wert von {formatCurrency(4567)}
                  </p>
                </div>
              </div>

              {/* Key Insights */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Key Insights</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>Premium Tier hat die höchste Retention Rate (94.8%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <span>Kreditkarten-Zahlungen generieren 45% des Umsatzes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <span>Conversion von Trial zu Abo liegt bei 50%</span>
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