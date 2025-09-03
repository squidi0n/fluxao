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
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Brain,
  Lightbulb,
  Star,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface TrendPrediction {
  topic: string;
  currentEngagement: number;
  predictedGrowth: number;
  confidence: number;
  timeframe: string;
  category: 'tech' | 'business' | 'lifestyle' | 'science';
  keywords: string[];
}

interface ContentForecast {
  title: string;
  predictedViews: number;
  currentViews: number;
  engagementScore: number;
  viralPotential: number;
  publishDate: Date;
  category: string;
}

interface RevenueProjection {
  date: string;
  predicted: number;
  confidence: number;
  factors: string[];
  scenario: 'pessimistic' | 'realistic' | 'optimistic';
}

interface AnomalyDetection {
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export default function PredictiveAnalytics() {
  const [trendPredictions, setTrendPredictions] = useState<TrendPrediction[]>([]);
  const [contentForecasts, setContentForecasts] = useState<ContentForecast[]>([]);
  const [revenueProjections, setRevenueProjections] = useState<RevenueProjection[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<'pessimistic' | 'realistic' | 'optimistic'>('realistic');
  const [isLoading, setIsLoading] = useState(true);

  const generateTrendPredictions = (): TrendPrediction[] => {
    return [
      {
        topic: 'Künstliche Intelligenz',
        currentEngagement: 8.7,
        predictedGrowth: 156,
        confidence: 94,
        timeframe: '30 Tage',
        category: 'tech',
        keywords: ['ChatGPT', 'Machine Learning', 'AI Tools', 'Automation'],
      },
      {
        topic: 'Blockchain & Web3',
        currentEngagement: 6.2,
        predictedGrowth: 89,
        confidence: 78,
        timeframe: '45 Tage',
        category: 'tech',
        keywords: ['NFT', 'DeFi', 'Smart Contracts', 'Ethereum'],
      },
      {
        topic: 'Remote Work',
        currentEngagement: 7.4,
        predictedGrowth: 34,
        confidence: 82,
        timeframe: '60 Tage',
        category: 'business',
        keywords: ['Homeoffice', 'Digital Nomad', 'Work-Life-Balance'],
      },
      {
        topic: 'Nachhaltigkeit',
        currentEngagement: 5.8,
        predictedGrowth: 67,
        confidence: 71,
        timeframe: '90 Tage',
        category: 'lifestyle',
        keywords: ['Green Tech', 'Climate Change', 'ESG', 'Renewable Energy'],
      },
      {
        topic: 'Quantum Computing',
        currentEngagement: 4.2,
        predictedGrowth: 234,
        confidence: 65,
        timeframe: '180 Tage',
        category: 'science',
        keywords: ['Quantum', 'IBM', 'Google', 'Quantum Supremacy'],
      },
    ];
  };

  const generateContentForecasts = (): ContentForecast[] => {
    return [
      {
        title: 'ChatGPT für Business: Der ultimative Guide',
        predictedViews: 23400,
        currentViews: 1200,
        engagementScore: 9.2,
        viralPotential: 85,
        publishDate: new Date(Date.now() + 86400000 * 2),
        category: 'AI & Tech',
      },
      {
        title: 'Startup Funding 2024: Neue Trends',
        predictedViews: 18700,
        currentViews: 890,
        engagementScore: 8.1,
        viralPotential: 72,
        publishDate: new Date(Date.now() + 86400000 * 5),
        category: 'Business',
      },
      {
        title: 'Remote Work Tools: Top 10 für 2024',
        predictedViews: 15600,
        currentViews: 450,
        engagementScore: 7.8,
        viralPotential: 68,
        publishDate: new Date(Date.now() + 86400000 * 1),
        category: 'Productivity',
      },
      {
        title: 'Green Tech Investments: Was sich lohnt',
        predictedViews: 12300,
        currentViews: 234,
        engagementScore: 7.2,
        viralPotential: 59,
        publishDate: new Date(Date.now() + 86400000 * 7),
        category: 'Sustainability',
      },
    ];
  };

  const generateRevenueProjections = (): RevenueProjection[] => {
    const scenarios = ['pessimistic', 'realistic', 'optimistic'] as const;
    const projections: RevenueProjection[] = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      scenarios.forEach(scenario => {
        const baseRevenue = 15000 + i * 1200;
        const multiplier = scenario === 'pessimistic' ? 0.7 : scenario === 'optimistic' ? 1.4 : 1.0;
        const variance = (Math.random() - 0.5) * 2000;
        
        projections.push({
          date: date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
          predicted: Math.round(baseRevenue * multiplier + variance),
          confidence: scenario === 'realistic' ? 85 : scenario === 'optimistic' ? 65 : 75,
          factors: [
            'Content Performance',
            'Market Trends',
            'Seasonality',
            'Competition',
          ],
          scenario,
        });
      });
    }
    
    return projections;
  };

  const generateAnomalies = (): AnomalyDetection[] => {
    return [
      {
        metric: 'Bounce Rate',
        currentValue: 68.4,
        expectedValue: 45.2,
        deviation: 51.3,
        severity: 'high',
        description: 'Bounce Rate ist ungewöhnlich hoch in den letzten 3 Tagen',
        recommendation: 'Prüfen Sie die Landing Page Performance und Ladezeiten',
      },
      {
        metric: 'Mobile Conversion',
        currentValue: 1.8,
        expectedValue: 3.2,
        deviation: -43.8,
        severity: 'medium',
        description: 'Mobile Conversions sind 44% niedriger als erwartet',
        recommendation: 'Optimieren Sie das mobile Checkout-Erlebnis',
      },
      {
        metric: 'Social Shares',
        currentValue: 456,
        expectedValue: 280,
        deviation: 62.9,
        severity: 'low',
        description: 'Social Media Shares übertreffen Erwartungen deutlich',
        recommendation: 'Nutzen Sie diesen Trend für mehr Social Content',
      },
    ];
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate AI model processing
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setTrendPredictions(generateTrendPredictions());
      setContentForecasts(generateContentForecasts());
      setRevenueProjections(generateRevenueProjections());
      setAnomalies(generateAnomalies());
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  const getCategoryColor = (category: string) => {
    const colors = {
      tech: 'bg-blue-100 text-blue-800',
      business: 'bg-green-100 text-green-800',
      lifestyle: 'bg-purple-100 text-purple-800',
      science: 'bg-orange-100 text-orange-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100',
    };
    return colors[severity as keyof typeof colors];
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      low: CheckCircle,
      medium: AlertTriangle,
      high: AlertTriangle,
    };
    const IconComponent = icons[severity as keyof typeof icons];
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredProjections = revenueProjections.filter(p => p.scenario === selectedScenario);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-200 rounded-lg"></div>
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Predictive Analytics</h2>
            <p className="text-gray-600">AI-powered insights and forecasting</p>
          </div>
        </div>
        
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
          <Zap className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Trend Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Trending Topics Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendPredictions.map((trend, index) => (
              <div key={trend.topic} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{trend.topic}</h4>
                    <Badge variant="secondary" className={getCategoryColor(trend.category)}>
                      {trend.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">+{trend.predictedGrowth}%</span>
                    </div>
                    <p className="text-xs text-gray-500">{trend.timeframe}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Engagement</span>
                    <span className="font-medium">{trend.currentEngagement}/10</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${trend.currentEngagement * 10}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Confidence</span>
                    <span className="font-medium text-blue-600">{trend.confidence}%</span>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-1">Keywords:</p>
                    <div className="flex flex-wrap gap-1">
                      {trend.keywords.slice(0, 3).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Performance Forecast & Revenue Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Content Performance Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentForecasts.map((forecast, index) => (
                <div key={forecast.title} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm flex-1 pr-2">{forecast.title}</h4>
                    <Badge 
                      variant={forecast.viralPotential > 70 ? 'default' : 'secondary'}
                      className={forecast.viralPotential > 70 ? 'bg-red-100 text-red-800' : ''}
                    >
                      {forecast.viralPotential}% Viral
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Predicted Views</p>
                      <p className="font-bold text-lg text-green-600">
                        {forecast.predictedViews.toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Views</p>
                      <p className="font-medium">{forecast.currentViews.toLocaleString('de-DE')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Engagement Score: {forecast.engagementScore}/10</span>
                    <span className="text-gray-600">
                      {forecast.publishDate.toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  
                  {/* Engagement bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1 rounded-full"
                      style={{ width: `${forecast.engagementScore * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Projections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Revenue Projections
              </CardTitle>
              
              <Tabs value={selectedScenario} onValueChange={(value: any) => setSelectedScenario(value)}>
                <TabsList className="h-8">
                  <TabsTrigger value="pessimistic" className="text-xs">Pessimistic</TabsTrigger>
                  <TabsTrigger value="realistic" className="text-xs">Realistic</TabsTrigger>
                  <TabsTrigger value="optimistic" className="text-xs">Optimistic</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={filteredProjections.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`€${Number(value).toLocaleString('de-DE')}`, 'Predicted Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {filteredProjections.slice(0, 3).map((projection, index) => (
                <div key={`${projection.date}-${projection.scenario}`} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{projection.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">
                      €{projection.predicted.toLocaleString('de-DE')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {projection.confidence}% Confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div key={anomaly.metric} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                    {getSeverityIcon(anomaly.severity)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{anomaly.metric}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {anomaly.currentValue}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={anomaly.deviation > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}
                        >
                          {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                    
                    <div className="flex items-start gap-2 text-xs">
                      <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{anomaly.recommendation}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}