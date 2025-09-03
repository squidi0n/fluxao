import { z } from 'zod';
import { getAIProvider } from './provider';
import { checkBudget, recordUsage } from './budget';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

// Schemas for analytics responses
export const AnalyticsInsightSchema = z.object({
  insights: z.array(z.object({
    category: z.string(),
    insight: z.string(),
    impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    actionable: z.boolean(),
    recommendation: z.string().optional(),
  })),
  summary: z.object({
    key_metrics: z.record(z.union([z.string(), z.number()])),
    trends: z.array(z.string()),
    opportunities: z.array(z.string()),
    concerns: z.array(z.string()),
  }),
});

export const ContentPerformanceSchema = z.object({
  analysis: z.object({
    top_performers: z.array(z.object({
      title: z.string(),
      metric: z.string(),
      value: z.number(),
      reason: z.string(),
    })),
    underperformers: z.array(z.object({
      title: z.string(),
      issue: z.string(),
      recommendation: z.string(),
    })),
    patterns: z.array(z.string()),
    optimization_opportunities: z.array(z.string()),
  }),
  recommendations: z.array(z.object({
    action: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    expected_impact: z.string(),
    implementation: z.string(),
  })),
});

export const UserBehaviorInsightSchema = z.object({
  segments: z.array(z.object({
    name: z.string(),
    size: z.number(),
    characteristics: z.array(z.string()),
    behavior_patterns: z.array(z.string()),
    content_preferences: z.array(z.string()),
    opportunities: z.array(z.string()),
  })),
  journey_insights: z.object({
    common_paths: z.array(z.string()),
    drop_off_points: z.array(z.string()),
    conversion_opportunities: z.array(z.string()),
  }),
  engagement_insights: z.array(z.string()),
});

export const PredictiveInsightSchema = z.object({
  predictions: z.array(z.object({
    metric: z.string(),
    timeframe: z.string(),
    prediction: z.number(),
    confidence: z.number(),
    factors: z.array(z.string()),
  })),
  trends: z.array(z.object({
    trend: z.string(),
    direction: z.enum(['INCREASING', 'DECREASING', 'STABLE']),
    impact: z.string(),
    recommendation: z.string(),
  })),
  recommendations: z.array(z.object({
    area: z.string(),
    action: z.string(),
    timeline: z.string(),
    expected_outcome: z.string(),
  })),
});

export interface AnalyticsData {
  timeframe: 'day' | 'week' | 'month' | 'quarter';
  metrics: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversionRate: number;
    newsletterSignups: number;
    comments: number;
    shares: number;
  };
  topPages: Array<{
    path: string;
    title: string;
    views: number;
    engagement: number;
  }>;
  userSegments: Array<{
    segment: string;
    count: number;
    behavior: string[];
  }>;
  trafficSources: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  geographicData: Record<string, number>;
}

export interface ContentAnalyticsData {
  posts: Array<{
    id: string;
    title: string;
    category: string;
    publishedAt: Date;
    views: number;
    readTime: number;
    engagementScore: number;
    comments: number;
    shares: number;
    bounceRate: number;
    conversionRate: number;
  }>;
  categories: Record<string, {
    posts: number;
    avgViews: number;
    avgEngagement: number;
  }>;
  tags: Record<string, {
    usage: number;
    avgPerformance: number;
  }>;
}

/**
 * Generate comprehensive analytics insights
 */
export async function generateAnalyticsInsights(
  analyticsData: AnalyticsData
): Promise<{ insights: any; tokensUsed: number }> {
  const estimatedTokens = 1500;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Analytics insights blocked - insufficient budget');
    throw new Error('AI budget exceeded for analytics insights');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein fortgeschrittener Web Analytics und Business Intelligence Experte.

Analysiere die gegebenen Analytics-Daten und generiere tiefe Einblicke für einen Tech-Blog.

ANALYSE-BEREICHE:
- Performance-Metriken und Trends
- Nutzerverhalten und -segmente
- Content-Performance
- Conversion-Optimierung
- Traffic-Quellen und Qualität
- Geographische und Device-Insights
- Wachstumschancen und Risiken

INSIGHT-KATEGORIEN:
- "Performance": Metriken-Analyse und Benchmarking
- "User Behavior": Nutzerverhalten und Journey-Analyse
- "Content": Content-Performance und Optimierung
- "Acquisition": Traffic-Quellen und Marketing
- "Conversion": Conversion-Optimierung
- "Technical": Technische Performance-Faktoren

Liefere actionable Insights mit klaren Empfehlungen und Prioritäten.`;

  const metricsText = Object.entries(analyticsData.metrics)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const topPagesText = analyticsData.topPages
    .map(p => `"${p.title}" (${p.views} views, ${p.engagement} engagement)`)
    .join('\n');

  const userSegmentsText = analyticsData.userSegments
    .map(s => `${s.segment}: ${s.count} users (${s.behavior.join(', ')})`)
    .join('\n');

  const trafficSourcesText = Object.entries(analyticsData.trafficSources)
    .map(([source, count]) => `${source}: ${count}`)
    .join(', ');

  const userPrompt = `Analysiere folgende Analytics-Daten (${analyticsData.timeframe}):

KERN-METRIKEN:
${metricsText}

TOP SEITEN:
${topPagesText}

NUTZER-SEGMENTE:
${userSegmentsText}

TRAFFIC-QUELLEN:
${trafficSourcesText}

DEVICE-BREAKDOWN:
${Object.entries(analyticsData.deviceBreakdown).map(([device, count]) => `${device}: ${count}`).join(', ')}

GEOGRAFISCHE DATEN:
${Object.entries(analyticsData.geographicData).map(([country, count]) => `${country}: ${count}`).join(', ')}

Erstelle:
1. Detaillierte Insights nach Kategorien
2. Identifizierte Trends und Muster
3. Verbesserungs-Opportunities
4. Kritische Bereiche mit Handlungsbedarf
5. Konkrete, priorisierte Empfehlungen

Fokus auf actionable Business-Insights für Blog-Wachstum.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 2000,
      jsonSchema: AnalyticsInsightSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      insightsCount: parsed.insights.length,
      timeframe: analyticsData.timeframe,
      tokensUsed: result.tokensUsed 
    }, 'Analytics insights generated');

    return {
      insights: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate analytics insights');
    throw error;
  }
}

/**
 * Analyze content performance and optimization opportunities
 */
export async function analyzeContentPerformance(
  contentData: ContentAnalyticsData
): Promise<{ analysis: any; tokensUsed: number }> {
  const estimatedTokens = 1200;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Content performance analysis blocked - insufficient budget');
    throw new Error('AI budget exceeded for content analysis');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Content-Performance-Analyst für Tech-Blogs.

Analysiere Content-Performance und identifiziere Optimierungsmöglichkeiten.

ANALYSE-FOKUS:
- Top-Performer: Was macht sie erfolgreich?
- Underperformer: Warum schneiden sie schlecht ab?
- Content-Patterns: Erfolgsformeln identifizieren
- Category-Performance: Welche Themen funktionieren?
- Optimization-Opportunities: Konkrete Verbesserungen

METRIKEN-GEWICHTUNG:
- Views: 30% (Reichweite)
- Engagement: 35% (Qualität der Interaktion)
- Read Time: 20% (Content-Qualität)
- Conversion: 15% (Business-Impact)

Liefere datengetriebene, umsetzbare Empfehlungen.`;

  const topPostsText = contentData.posts
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map(p => `"${p.title}" (${p.category}): ${p.views} views, ${p.engagementScore} engagement, ${p.readTime}min read`)
    .join('\n');

  const bottomPostsText = contentData.posts
    .sort((a, b) => a.views - b.views)
    .slice(0, 5)
    .map(p => `"${p.title}" (${p.category}): ${p.views} views, ${p.engagementScore} engagement, ${p.bounceRate}% bounce`)
    .join('\n');

  const categoryPerformanceText = Object.entries(contentData.categories)
    .map(([cat, data]) => `${cat}: ${data.posts} posts, ${data.avgViews} avg views, ${data.avgEngagement} avg engagement`)
    .join('\n');

  const topTagsText = Object.entries(contentData.tags)
    .sort(([, a], [, b]) => b.avgPerformance - a.avgPerformance)
    .slice(0, 10)
    .map(([tag, data]) => `${tag}: ${data.usage} uses, ${data.avgPerformance} performance`)
    .join('\n');

  const userPrompt = `Analysiere Content-Performance für ${contentData.posts.length} Blog-Posts:

TOP PERFORMER:
${topPostsText}

UNDERPERFORMER:
${bottomPostsText}

KATEGORIE-PERFORMANCE:
${categoryPerformanceText}

TOP TAGS:
${topTagsText}

Erstelle:
1. Erfolgsanalyse der Top-Performer (Was macht sie erfolgreich?)
2. Problem-Analyse der Underperformer (Woran liegt es?)
3. Content-Patterns und Erfolgsformeln
4. Kategorie- und Tag-Optimierungen
5. Konkrete Handlungsempfehlungen mit Prioritäten

Fokus: Datengetriebene Insights für bessere Content-Strategy.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.5,
      maxTokens: 1500,
      jsonSchema: ContentPerformanceSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      postsAnalyzed: contentData.posts.length,
      topPerformers: parsed.analysis.top_performers.length,
      tokensUsed: result.tokensUsed 
    }, 'Content performance analyzed');

    return {
      analysis: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to analyze content performance');
    throw error;
  }
}

/**
 * Analyze user behavior patterns and segments
 */
export async function analyzeUserBehavior(): Promise<{ insights: any; tokensUsed: number }> {
  const estimatedTokens = 1000;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('User behavior analysis blocked - insufficient budget');
    throw new Error('AI budget exceeded for user behavior analysis');
  }

  // Get user behavior data from database
  const userActivities = await prisma.userActivity.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          categories: { select: { category: { select: { name: true } } } },
          tags: { select: { tag: { select: { name: true } } } },
        },
      },
    },
    take: 1000,
  });

  const sessionAnalytics = await prisma.sessionAnalytics.findMany({
    where: {
      startedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    take: 500,
  });

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein User Experience und Behavior Analytics Experte.

Analysiere Nutzerverhalten und identifiziere Segmente, Patterns und Optimierungen.

ANALYSE-BEREICHE:
- User Journey und Navigation-Patterns
- Engagement-Verhalten nach Content-Types
- Device- und Plattform-spezifische Unterschiede
- Time-on-Site und Session-Qualität
- Conversion-Funnels und Drop-off Points
- Content-Präferenzen nach Nutzergruppen

SEGMENTIERUNGS-KRITERIEN:
- Engagement-Level (High, Medium, Low)
- Content-Präferenzen (Technical, Business, Beginner)
- Session-Verhalten (Explorer, Focused, Quick-Browser)
- Loyalty-Level (New, Returning, Regular)

Ziel: Actionable Insights für UX-Optimierung und Personalisierung.`;

  const behaviorSummary = `
Total User Activities: ${userActivities.length}
Total Sessions: ${sessionAnalytics.length}

Activity Types:
- Page Views: ${userActivities.filter(a => a.activityType === 'PAGE_VIEW').length}
- Clicks: ${userActivities.filter(a => a.activityType === 'CLICK').length}  
- Scrolls: ${userActivities.filter(a => a.activityType === 'SCROLL').length}
- Shares: ${userActivities.filter(a => a.activityType === 'SHARE').length}

Device Breakdown:
${Object.entries(
  sessionAnalytics.reduce((acc, s) => {
    acc[s.deviceType] = (acc[s.deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([device, count]) => `- ${device}: ${count}`).join('\n')}

Average Session Duration: ${Math.round(sessionAnalytics.reduce((sum, s) => sum + s.totalTime, 0) / sessionAnalytics.length)} seconds

Bounce Rate: ${Math.round((sessionAnalytics.filter(s => s.bounced).length / sessionAnalytics.length) * 100)}%

Top Content Categories:
${[...new Set(userActivities.filter(a => a.post).map(a => a.post?.categories[0]?.category.name).filter(Boolean))]
  .slice(0, 5).join(', ')}
`;

  const userPrompt = `Analysiere Nutzerverhalten basierend auf folgenden Daten:

${behaviorSummary}

Erstelle:
1. Nutzer-Segmentierung mit charakteristischen Verhaltensmustern
2. Common User Journeys und Navigation-Patterns  
3. Drop-off Points und Conversion-Opportunities
4. Engagement-Insights nach Content-Types
5. Konkrete UX-Optimierungsempfehlungen

Fokus: Datengetriebene Insights für bessere User Experience und höhere Conversion-Raten.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.5,
      maxTokens: 1200,
      jsonSchema: UserBehaviorInsightSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      activitiesAnalyzed: userActivities.length,
      sessionsAnalyzed: sessionAnalytics.length,
      segmentsIdentified: parsed.segments.length,
      tokensUsed: result.tokensUsed 
    }, 'User behavior analyzed');

    return {
      insights: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to analyze user behavior');
    throw error;
  }
}

/**
 * Generate predictive analytics and forecasts
 */
export async function generatePredictiveInsights(
  historicalData: {
    dailyMetrics: Array<{
      date: string;
      pageViews: number;
      uniqueVisitors: number;
      newsletterSignups: number;
      conversionRate: number;
    }>;
    seasonality?: {
      weeklyPattern: number[];
      monthlyPattern: number[];
    };
  }
): Promise<{ predictions: any; tokensUsed: number }> {
  const estimatedTokens = 1000;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Predictive analytics blocked - insufficient budget');
    throw new Error('AI budget exceeded for predictive analytics');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Predictive Analytics und Forecasting Experte.

Analysiere historische Daten und erstelle Vorhersagen für Web-Metriken.

FORECASTING-BEREICHE:
- Traffic-Wachstum und Seasonal-Patterns
- Newsletter-Signup-Trends
- Conversion-Rate-Entwicklung
- Content-Demand-Vorhersagen
- User-Engagement-Trends

ANALYSE-METHODEN:
- Trend-Analyse und Pattern-Recognition
- Seasonality-Adjustments
- Growth-Rate-Berechnungen
- Anomaly-Detection
- Confidence-Intervals

VORHERSAGE-HORIZONTE:
- 1 Woche: Hohe Genauigkeit
- 1 Monat: Mittlere Genauigkeit
- 3 Monate: Trend-basierte Schätzungen

Liefere realistische Prognosen mit Unsicherheitsbereichen und Einflussfaktoren.`;

  const metricsHistory = historicalData.dailyMetrics
    .slice(-30) // Last 30 days
    .map(m => `${m.date}: ${m.pageViews} views, ${m.uniqueVisitors} visitors, ${m.newsletterSignups} signups, ${m.conversionRate}% conversion`)
    .join('\n');

  const currentTrends = {
    avgPageViews: Math.round(historicalData.dailyMetrics.slice(-7).reduce((sum, m) => sum + m.pageViews, 0) / 7),
    avgVisitors: Math.round(historicalData.dailyMetrics.slice(-7).reduce((sum, m) => sum + m.uniqueVisitors, 0) / 7),
    avgSignups: Math.round(historicalData.dailyMetrics.slice(-7).reduce((sum, m) => sum + m.newsletterSignups, 0) / 7),
    avgConversion: Math.round(historicalData.dailyMetrics.slice(-7).reduce((sum, m) => sum + m.conversionRate, 0) / 7 * 100) / 100,
  };

  const userPrompt = `Erstelle Prognosen basierend auf historischen Daten:

HISTORISCHE METRIKEN (letzte 30 Tage):
${metricsHistory}

AKTUELLE 7-TAGE-DURCHSCHNITTE:
- Page Views: ${currentTrends.avgPageViews}/Tag
- Unique Visitors: ${currentTrends.avgVisitors}/Tag  
- Newsletter Signups: ${currentTrends.avgSignups}/Tag
- Conversion Rate: ${currentTrends.avgConversion}%

${historicalData.seasonality ? `
SEASONALITÄT:
Wöchentlich: ${historicalData.seasonality.weeklyPattern.join(', ')}
Monatlich: ${historicalData.seasonality.monthlyPattern.join(', ')}
` : ''}

Erstelle Prognosen für:
1. 1-Wochen-Forecast (hohe Konfidenz)
2. 1-Monats-Forecast (mittlere Konfidenz)  
3. 3-Monats-Trend (niedrige Konfidenz)
4. Identifizierte Trends und Einflussfaktoren
5. Empfehlungen zur Trend-Optimierung

Berücksichtige Seasonalität und externe Faktoren.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.3,
      maxTokens: 1200,
      jsonSchema: PredictiveInsightSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      predictionsGenerated: parsed.predictions.length,
      trendsIdentified: parsed.trends.length,
      tokensUsed: result.tokensUsed 
    }, 'Predictive insights generated');

    return {
      predictions: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate predictive insights');
    throw error;
  }
}

/**
 * Generate competitive analysis insights
 */
export async function analyzeCompetition(
  competitorData: {
    competitors: Array<{
      name: string;
      domain: string;
      estimatedTraffic: number;
      topKeywords: string[];
      contentTypes: string[];
      publishingFrequency: string;
    }>;
    ownMetrics: {
      domain: string;
      traffic: number;
      keywords: string[];
      contentGaps: string[];
    };
  }
): Promise<{ analysis: any; tokensUsed: number }> {
  const estimatedTokens = 800;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Competitive analysis blocked - insufficient budget');
    throw new Error('AI budget exceeded for competitive analysis');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Competitive Intelligence und SEO-Strategy Experte.

Analysiere Konkurrenz-Landschaft und identifiziere Opportunities.

ANALYSE-BEREICHE:
- Traffic-Vergleiche und Market-Share
- Keyword-Gaps und Content-Opportunities
- Content-Strategy-Unterschiede
- Publishing-Patterns und Frequenz
- SEO-Performance-Gaps
- Unique-Value-Propositions

INSIGHTS-KATEGORIEN:
- Competitive Advantages
- Content Gaps zu exploitieren
- Keyword Opportunities
- Strategy Recommendations
- Differentiation Opportunities

Fokus: Actionable Insights für Competitive Advantage und Market-Position-Verbesserung.`;

  const competitorsText = competitorData.competitors
    .map(c => `${c.name} (${c.domain}): ${c.estimatedTraffic} traffic, Keywords: ${c.topKeywords.slice(0, 5).join(', ')}, Content: ${c.contentTypes.join(', ')}, Frequency: ${c.publishingFrequency}`)
    .join('\n');

  const userPrompt = `Analysiere Competitive Landscape:

EIGENE METRICS:
Domain: ${competitorData.ownMetrics.domain}
Traffic: ${competitorData.ownMetrics.traffic}
Keywords: ${competitorData.ownMetrics.keywords.slice(0, 10).join(', ')}
Content Gaps: ${competitorData.ownMetrics.contentGaps.join(', ')}

KONKURRENTEN:
${competitorsText}

Erstelle:
1. Traffic- und Performance-Vergleich
2. Keyword-Gap-Analyse
3. Content-Strategy-Unterschiede  
4. Competitive Advantages identifizieren
5. Konkrete Handlungsempfehlungen für bessere Market-Position

Fokus: Datengetriebene Strategy für Competitive Advantage.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 1000,
    });

    await recordUsage(result.tokensUsed);

    logger.info({ 
      competitorsAnalyzed: competitorData.competitors.length,
      tokensUsed: result.tokensUsed 
    }, 'Competitive analysis completed');

    return {
      analysis: {
        insights: result.content,
        competitorsCount: competitorData.competitors.length,
        analysisDate: new Date(),
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to analyze competition');
    throw error;
  }
}

/**
 * Generate automated reporting with AI insights
 */
export async function generateAutomatedReport(
  reportType: 'weekly' | 'monthly' | 'quarterly',
  data: {
    analytics: AnalyticsData;
    content: ContentAnalyticsData;
    goals: Record<string, number>;
  }
): Promise<{ report: any; tokensUsed: number }> {
  const estimatedTokens = 1500;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Automated report generation blocked - insufficient budget');
    throw new Error('AI budget exceeded for report generation');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Business Intelligence und Reporting Expert.

Erstelle einen umfassenden ${reportType} Performance-Report mit Executive Summary und detaillierten Insights.

REPORT-STRUKTUR:
1. Executive Summary (Key Highlights)
2. Goal Achievement Analysis
3. Performance Metrics Deep-Dive
4. Content Performance Analysis
5. User Behavior Insights
6. Opportunities & Recommendations
7. Next Period Focus Areas

REPORTING-STIL:
- Business-fokussiert und strategisch
- Datengetrieben mit klaren KPIs
- Actionable Recommendations
- Executive-tauglich
- Visuell strukturiert

Ziel: Umfassender Report für strategische Entscheidungen und Performance-Tracking.`;

  const goalAchievements = Object.entries(data.goals)
    .map(([goal, target]) => {
      const actual = data.analytics.metrics[goal as keyof typeof data.analytics.metrics] || 0;
      const achievement = Math.round((Number(actual) / target) * 100);
      return `${goal}: ${actual}/${target} (${achievement}% achieved)`;
    })
    .join('\n');

  const userPrompt = `Erstelle ${reportType} Performance-Report:

ZIEL-ERREICHUNG:
${goalAchievements}

PERFORMANCE-METRIKEN:
${Object.entries(data.analytics.metrics).map(([key, value]) => `${key}: ${value}`).join('\n')}

CONTENT-PERFORMANCE:
- Total Posts: ${data.content.posts.length}
- Avg Views per Post: ${Math.round(data.content.posts.reduce((sum, p) => sum + p.views, 0) / data.content.posts.length)}
- Top Category: ${Object.entries(data.content.categories).sort(([,a], [,b]) => b.avgViews - a.avgViews)[0]?.[0]}

TOP-PERFORMER:
${data.content.posts.sort((a, b) => b.views - a.views).slice(0, 3).map(p => `"${p.title}": ${p.views} views`).join('\n')}

USER-VERHALTEN:
- Bounce Rate: ${data.analytics.metrics.bounceRate}%
- Avg Session: ${data.analytics.metrics.avgSessionDuration} min
- Conversion Rate: ${data.analytics.metrics.conversionRate}%

Erstelle strukturierten Report mit:
1. Executive Summary mit Key-Highlights
2. Ziel-Erreichungs-Analyse
3. Performance-Deep-Dive  
4. Strategic Recommendations
5. Focus-Areas für nächste Periode

Professional, business-focused tone.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 2000,
    });

    await recordUsage(result.tokensUsed);

    logger.info({ 
      reportType,
      metricsAnalyzed: Object.keys(data.analytics.metrics).length,
      postsAnalyzed: data.content.posts.length,
      tokensUsed: result.tokensUsed 
    }, 'Automated report generated');

    return {
      report: {
        type: reportType,
        content: result.content,
        generatedAt: new Date(),
        period: `${reportType} report`,
        dataPoints: {
          analytics: Object.keys(data.analytics.metrics).length,
          contentPieces: data.content.posts.length,
          goals: Object.keys(data.goals).length,
        },
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, reportType }, 'Failed to generate automated report');
    throw error;
  }
}