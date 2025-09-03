import { z } from 'zod';
import { getAIProvider } from './provider';
import { checkBudget, recordUsage } from './budget';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

// Schemas for admin AI tools
export const ContentAuditSchema = z.object({
  audit_results: z.array(z.object({
    post_id: z.string(),
    title: z.string(),
    issues: z.array(z.object({
      category: z.enum(['SEO', 'QUALITY', 'STRUCTURE', 'READABILITY', 'TECHNICAL']),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      issue: z.string(),
      recommendation: z.string(),
      estimated_impact: z.string(),
    })),
    overall_score: z.number().min(0).max(100),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
  summary: z.object({
    total_posts: z.number(),
    avg_score: z.number(),
    critical_issues: z.number(),
    top_recommendations: z.array(z.string()),
  }),
});

export const UserEngagementInsightSchema = z.object({
  insights: z.array(z.object({
    user_segment: z.string(),
    behavior_pattern: z.string(),
    engagement_score: z.number().min(0).max(100),
    content_preferences: z.array(z.string()),
    opportunities: z.array(z.string()),
    risks: z.array(z.string()),
  })),
  recommendations: z.array(z.object({
    action: z.string(),
    target_segment: z.string(),
    expected_impact: z.string(),
    implementation: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
});

export const AutoModerationReportSchema = z.object({
  period: z.string(),
  statistics: z.object({
    total_comments: z.number(),
    auto_approved: z.number(),
    auto_rejected: z.number(),
    needs_review: z.number(),
    accuracy_score: z.number(),
  }),
  insights: z.array(z.string()),
  model_performance: z.object({
    precision: z.number(),
    recall: z.number(),
    false_positives: z.number(),
    false_negatives: z.number(),
  }),
  recommendations: z.array(z.string()),
});

export const ContentStrategySchema = z.object({
  strategy: z.object({
    focus_areas: z.array(z.string()),
    content_gaps: z.array(z.object({
      topic: z.string(),
      opportunity_score: z.number(),
      competition_level: z.string(),
      content_ideas: z.array(z.string()),
    })),
    audience_insights: z.array(z.string()),
    performance_optimization: z.array(z.string()),
  }),
  roadmap: z.array(z.object({
    timeframe: z.string(),
    goals: z.array(z.string()),
    content_types: z.array(z.string()),
    metrics: z.array(z.string()),
  })),
});

export interface AdminAuditOptions {
  includeUnpublished?: boolean;
  focusAreas?: ('SEO' | 'QUALITY' | 'STRUCTURE' | 'READABILITY' | 'TECHNICAL')[];
  timeframe?: 'week' | 'month' | 'quarter' | 'all';
  minScore?: number;
}

/**
 * Perform comprehensive content audit with AI analysis
 */
export async function performContentAudit(
  options: AdminAuditOptions = {}
): Promise<{ audit: any; tokensUsed: number }> {
  const estimatedTokens = 2500;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Content audit blocked - insufficient budget');
    throw new Error('AI budget exceeded for content audit');
  }

  const {
    includeUnpublished = false,
    focusAreas = ['SEO', 'QUALITY', 'STRUCTURE', 'READABILITY'],
    timeframe = 'month',
    minScore = 0,
  } = options;

  // Get posts to audit
  const timeFrameDate = getTimeFrameDate(timeframe);
  const posts = await prisma.post.findMany({
    where: {
      ...(includeUnpublished ? {} : { status: 'PUBLISHED' }),
      createdAt: timeFrameDate ? { gte: timeFrameDate } : undefined,
    },
    include: {
      author: { select: { name: true } },
      categories: { select: { category: { select: { name: true } } } },
      tags: { select: { tag: { select: { name: true } } } },
      postAnalytics: true,
      comments: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit for performance
  });

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein erfahrener Content-Audit-Experte und SEO-Analyst.

Führe eine umfassende Analyse der Blog-Posts durch und identifiziere Verbesserungsmöglichkeiten.

AUDIT-BEREICHE:
${focusAreas.map(area => {
  switch (area) {
    case 'SEO': return '- SEO: Keywords, Meta-Descriptions, Struktur, interne Verlinkung';
    case 'QUALITY': return '- QUALITÄT: Inhaltliche Tiefe, Genauigkeit, Aktualität, Mehrwert';
    case 'STRUCTURE': return '- STRUKTUR: Überschriften, Absätze, Listen, Lesbarkeit';
    case 'READABILITY': return '- LESBARKEIT: Satzbau, Verständlichkeit, Zielgruppen-Anpassung';
    case 'TECHNICAL': return '- TECHNISCH: Ladezeiten, mobile Optimierung, Barrierefreiheit';
    default: return `- ${area}`;
  }
}).join('\n')}

BEWERTUNGSKRITERIEN:
- Inhaltliche Qualität und Genauigkeit
- SEO-Optimierung und Auffindbarkeit
- User Experience und Engagement
- Technische Performance
- Conversion-Potential

Priorisiere Issues nach Business-Impact und Umsetzbarkeit.`;

  const postsData = posts.slice(0, 20).map(post => ({
    id: post.id,
    title: post.title,
    content: post.content?.slice(0, 1000) || '',
    summary: post.summary || '',
    categories: post.categories.map(c => c.category.name),
    tags: post.tags.map(t => t.tag.name),
    views: post.postAnalytics?.views || 0,
    comments: post.comments.length,
    publishedAt: post.publishedAt?.toISOString().split('T')[0],
  }));

  const userPrompt = `Analysiere folgende ${postsData.length} Blog-Posts:

${postsData.map(post => `
POST: "${post.title}" (ID: ${post.id})
Kategorien: ${post.categories.join(', ')}
Tags: ${post.tags.join(', ')}
Views: ${post.views}, Comments: ${post.comments}
Published: ${post.publishedAt}
Content: ${post.content.slice(0, 300)}...
`).join('\n')}

AUDIT-FOKUS: ${focusAreas.join(', ')}

Für jeden Post identifiziere:
1. Spezifische Issues nach Kategorien
2. Schweregrad und Business-Impact
3. Konkrete Handlungsempfehlungen
4. Overall-Score (0-100)
5. Priorität für Optimierung

Zusätzlich erstelle:
- Gesamtstatistik über alle Posts
- Top-Empfehlungen für größten Impact
- Priorisierte Action Items`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.3,
      maxTokens: 3000,
      jsonSchema: ContentAuditSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      postsAudited: parsed.audit_results.length,
      avgScore: parsed.summary.avg_score,
      criticalIssues: parsed.summary.critical_issues,
      tokensUsed: result.tokensUsed 
    }, 'Content audit completed');

    return {
      audit: {
        ...parsed,
        audit_date: new Date(),
        options,
        posts_analyzed: postsData.length,
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to perform content audit');
    throw error;
  }
}

/**
 * Generate user engagement insights for admin dashboard
 */
export async function generateUserEngagementInsights(
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<{ insights: any; tokensUsed: number }> {
  const estimatedTokens = 1500;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('User engagement insights blocked - insufficient budget');
    throw new Error('AI budget exceeded for engagement insights');
  }

  // Get user activity data
  const timeFrameDate = getTimeFrameDate(timeframe);
  const userActivities = await prisma.userActivity.findMany({
    where: {
      createdAt: { gte: timeFrameDate },
    },
    include: {
      post: {
        select: {
          title: true,
          categories: { select: { category: { select: { name: true } } } },
        },
      },
    },
    take: 1000,
  });

  const sessionAnalytics = await prisma.sessionAnalytics.findMany({
    where: {
      startedAt: { gte: timeFrameDate },
    },
    take: 500,
  });

  const comments = await prisma.comment.findMany({
    where: {
      createdAt: { gte: timeFrameDate },
    },
    include: {
      post: {
        select: { title: true },
      },
    },
    take: 200,
  });

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein User Engagement und Community-Management Experte.

Analysiere Nutzerverhalten und erstelle actionable Insights für Admin-Entscheidungen.

ANALYSE-BEREICHE:
- User Segmentierung nach Engagement-Level
- Content-Präferenzen und -Performance
- Community-Gesundheit und Interaktionen
- Conversion-Patterns und -Opportunities
- Churn-Risiken und Retention-Strategien

INSIGHTS-KATEGORIEN:
- Behavioral Patterns: Wie nutzen User die Plattform?
- Content Preferences: Was funktioniert bei welcher Zielgruppe?
- Engagement Opportunities: Wo kann Engagement verbessert werden?
- Risk Factors: Welche User-Gruppen sind gefährdet?
- Growth Potential: Wo sind Wachstumschancen?

Fokus: Actionable Insights für Community-Wachstum und User-Retention.`;

  const engagementData = `
AKTIVITÄTS-DATEN (${timeframe}):
- Total User Activities: ${userActivities.length}
- Page Views: ${userActivities.filter(a => a.activityType === 'PAGE_VIEW').length}
- Interactions: ${userActivities.filter(a => ['CLICK', 'SHARE', 'LIKE'].includes(a.activityType)).length}
- Sessions: ${sessionAnalytics.length}
- Comments: ${comments.length}

TOP AKTIVITÄTS-TYPEN:
${Object.entries(
  userActivities.reduce((acc, a) => {
    acc[a.activityType] = (acc[a.activityType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([type, count]) => `${type}: ${count}`).join('\n')}

DEVICE BREAKDOWN:
${Object.entries(
  sessionAnalytics.reduce((acc, s) => {
    acc[s.deviceType] = (acc[s.deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([device, count]) => `${device}: ${count}`).join('\n')}

SESSION QUALITÄT:
- Avg Duration: ${Math.round(sessionAnalytics.reduce((sum, s) => sum + s.totalTime, 0) / sessionAnalytics.length)} seconds
- Bounce Rate: ${Math.round((sessionAnalytics.filter(s => s.bounced).length / sessionAnalytics.length) * 100)}%
- Conversion Rate: ${Math.round((sessionAnalytics.filter(s => s.converted).length / sessionAnalytics.length) * 100)}%

TOP CONTENT KATEGORIEN:
${[...new Set(userActivities.filter(a => a.post).map(a => a.post?.categories[0]?.category.name).filter(Boolean))]
  .slice(0, 5).join(', ')}
`;

  const userPrompt = `Analysiere User Engagement für Admin Dashboard:

${engagementData}

Erstelle Insights für:
1. User-Segmentierung mit charakteristischen Verhaltensmustern
2. Content-Performance nach Zielgruppen
3. Engagement-Optimization-Opportunities
4. User-Retention-Risiken und -Strategien
5. Konkrete Handlungsempfehlungen für Admins

Fokus: Datengetriebene Insights für bessere Community-Management-Entscheidungen.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.5,
      maxTokens: 2000,
      jsonSchema: UserEngagementInsightSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      segmentsIdentified: parsed.insights.length,
      recommendationsGenerated: parsed.recommendations.length,
      activitiesAnalyzed: userActivities.length,
      tokensUsed: result.tokensUsed 
    }, 'User engagement insights generated');

    return {
      insights: {
        ...parsed,
        analysis_period: timeframe,
        data_points: {
          activities: userActivities.length,
          sessions: sessionAnalytics.length,
          comments: comments.length,
        },
        generated_at: new Date(),
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate user engagement insights');
    throw error;
  }
}

/**
 * Generate automated moderation performance report
 */
export async function generateModerationReport(
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<{ report: any; tokensUsed: number }> {
  const estimatedTokens = 800;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Moderation report blocked - insufficient budget');
    throw new Error('AI budget exceeded for moderation report');
  }

  const timeFrameDate = getTimeFrameDate(timeframe);
  
  // Get moderation data
  const comments = await prisma.comment.findMany({
    where: {
      createdAt: { gte: timeFrameDate },
    },
    select: {
      id: true,
      status: true,
      moderationStatus: true,
      moderationScore: true,
      aiReviewed: true,
      humanFeedback: true,
      createdAt: true,
    },
  });

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein AI-Moderation-Performance-Analyst.

Analysiere die Performance des automatischen Moderations-Systems und erstelle einen Bericht.

ANALYSE-BEREICHE:
- Genauigkeit der AI-Moderation
- False-Positive und False-Negative Raten
- Human-Review-Patterns
- System-Performance-Trends
- Optimierungsempfehlungen

METRIKEN:
- Precision: Wie viele als spam markierte waren wirklich spam?
- Recall: Wie viele spam-Kommentare wurden erkannt?
- Accuracy: Overall-Genauigkeit
- Review-Rate: Wie viele benötigten menschliche Review?

Ziel: Datengetriebene Optimierung des Moderations-Systems.`;

  const moderationStats = {
    total: comments.length,
    ai_reviewed: comments.filter(c => c.aiReviewed).length,
    auto_approved: comments.filter(c => c.moderationStatus === 'ok').length,
    auto_rejected: comments.filter(c => c.moderationStatus === 'spam' || c.moderationStatus === 'toxic').length,
    needs_review: comments.filter(c => c.moderationStatus === 'review' || c.status === 'PENDING').length,
    human_feedback: comments.filter(c => c.humanFeedback).length,
  };

  const userPrompt = `Analysiere Moderation-Performance für ${timeframe}:

STATISTIKEN:
- Total Comments: ${moderationStats.total}
- AI Reviewed: ${moderationStats.ai_reviewed} (${Math.round((moderationStats.ai_reviewed / moderationStats.total) * 100)}%)
- Auto Approved: ${moderationStats.auto_approved}
- Auto Rejected: ${moderationStats.auto_rejected}
- Needs Review: ${moderationStats.needs_review}
- Human Feedback: ${moderationStats.human_feedback}

MODERATION STATUS BREAKDOWN:
${Object.entries(
  comments.reduce((acc, c) => {
    acc[c.moderationStatus] = (acc[c.moderationStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([status, count]) => `${status}: ${count}`).join('\n')}

CONFIDENCE SCORES:
- Average Score: ${Math.round(comments.filter(c => c.moderationScore).reduce((sum, c) => sum + (c.moderationScore || 0), 0) / comments.filter(c => c.moderationScore).length * 100) / 100}
- High Confidence (>0.8): ${comments.filter(c => (c.moderationScore || 0) > 0.8).length}
- Low Confidence (<0.3): ${comments.filter(c => (c.moderationScore || 0) < 0.3).length}

Erstelle Performance-Report mit:
1. Accuracy und Performance-Metriken
2. Identifizierte Patterns und Trends
3. False-Positive/Negative Analyse
4. Optimierungsempfehlungen
5. Model-Improvement-Vorschläge`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.3,
      maxTokens: 1000,
      jsonSchema: AutoModerationReportSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      commentsAnalyzed: moderationStats.total,
      aiReviewedPercent: Math.round((moderationStats.ai_reviewed / moderationStats.total) * 100),
      tokensUsed: result.tokensUsed 
    }, 'Moderation report generated');

    return {
      report: {
        ...parsed,
        period: timeframe,
        raw_statistics: moderationStats,
        generated_at: new Date(),
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate moderation report');
    throw error;
  }
}

/**
 * Generate content strategy recommendations
 */
export async function generateContentStrategy(
  analysisData: {
    topPerformingPosts: any[];
    underperformingPosts: any[];
    userSegments: any[];
    competitorInsights?: any[];
    businessGoals: string[];
  }
): Promise<{ strategy: any; tokensUsed: number }> {
  const estimatedTokens = 1800;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Content strategy generation blocked - insufficient budget');
    throw new Error('AI budget exceeded for content strategy');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein strategischer Content-Marketing-Berater und Business-Analyst.

Entwickle eine datengetriebene Content-Strategy für nachhaltiges Wachstum.

STRATEGY-KOMPONENTEN:
- Content-Gap-Analyse und Opportunities
- Audience-Development und Segmentierung
- Content-Mix-Optimierung
- SEO und Traffic-Strategien
- Community-Building und Engagement
- Monetarisierung und Business-Goals

PLANNING-HORIZONTE:
- Kurzfristig (1-3 Monate): Quick Wins und Optimierungen
- Mittelfristig (3-6 Monate): Strategische Initiativen
- Langfristig (6-12 Monate): Transformation und Skalierung

Fokus: ROI-optimierte, datengetriebene Empfehlungen für messbares Wachstum.`;

  const topPostsText = analysisData.topPerformingPosts
    .slice(0, 5)
    .map(p => `"${p.title}": ${p.views} views, ${p.engagement} engagement`)
    .join('\n');

  const underperformingText = analysisData.underperformingPosts
    .slice(0, 5)
    .map(p => `"${p.title}": ${p.views} views, ${p.issues?.join(', ') || 'Low engagement'}`)
    .join('\n');

  const segmentsText = analysisData.userSegments
    .map(s => `${s.name}: ${s.size} users, Interests: ${s.interests?.join(', ')}`)
    .join('\n');

  const userPrompt = `Entwickle Content-Strategy basierend auf Datenanalyse:

BUSINESS-ZIELE:
${analysisData.businessGoals.join('\n- ')}

TOP-PERFORMER:
${topPostsText}

UNDERPERFORMER:
${underperformingText}

USER-SEGMENTE:
${segmentsText}

${analysisData.competitorInsights ? `
COMPETITOR INSIGHTS:
${JSON.stringify(analysisData.competitorInsights, null, 2)}
` : ''}

Erstelle:
1. Strategic Focus Areas für die nächsten 6-12 Monate
2. Content-Gap-Analyse mit Opportunity-Scoring
3. Audience-Insights und Segmentierungs-Strategien
4. Performance-Optimization-Roadmap
5. Roadmap mit konkreten Zielen und Metriken

Priorisiere nach Business-Impact und Umsetzbarkeit.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 2200,
      jsonSchema: ContentStrategySchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      focusAreas: parsed.strategy.focus_areas.length,
      contentGaps: parsed.strategy.content_gaps.length,
      roadmapItems: parsed.roadmap.length,
      tokensUsed: result.tokensUsed 
    }, 'Content strategy generated');

    return {
      strategy: {
        ...parsed,
        business_goals: analysisData.businessGoals,
        data_basis: {
          top_posts: analysisData.topPerformingPosts.length,
          underperforming_posts: analysisData.underperformingPosts.length,
          user_segments: analysisData.userSegments.length,
        },
        created_at: new Date(),
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate content strategy');
    throw error;
  }
}

/**
 * Generate automated admin alerts and notifications
 */
export async function generateAdminAlerts(
  metrics: {
    trafficDrop?: number;
    engagementDrop?: number;
    spamIncrease?: number;
    errorRate?: number;
    performanceIssues?: string[];
  }
): Promise<{ alerts: any[]; tokensUsed: number }> {
  const estimatedTokens = 500;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Admin alerts generation blocked - insufficient budget');
    return { alerts: [], tokensUsed: 0 };
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein System-Monitoring und Alert-Management-Experte.

Analysiere Performance-Metriken und generiere prioritätsbasierte Admin-Alerts.

ALERT-KATEGORIEN:
- CRITICAL: Sofortiger Handlungsbedarf
- HIGH: Binnen 24h addressieren
- MEDIUM: Diese Woche bearbeiten
- LOW: Monitoring fortsetzen

ALERT-BEREICHE:
- Performance und Verfügbarkeit
- Content und SEO
- User Experience
- Security und Moderation
- Business Metrics

Fokus: Actionable Alerts mit klaren nächsten Schritten.`;

  const metricsText = Object.entries(metrics)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');

  const userPrompt = `Analysiere Metriken und generiere Admin-Alerts:

AKTUELLE METRIKEN:
${metricsText}

Erstelle für jede Auffälligkeit:
1. Alert-Level (CRITICAL/HIGH/MEDIUM/LOW)
2. Problem-Beschreibung
3. Potentielle Auswirkungen
4. Empfohlene Sofort-Maßnahmen
5. Monitoring-Empfehlungen

Priorisiere nach Business-Impact und Dringlichkeit.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.3,
      maxTokens: 800,
    });

    await recordUsage(result.tokensUsed);

    // Parse alerts from response
    const alerts: any[] = [];
    const lines = result.content.split('\n').filter(line => line.trim());
    
    let currentAlert: any = null;
    for (const line of lines) {
      if (line.includes('CRITICAL') || line.includes('HIGH') || line.includes('MEDIUM') || line.includes('LOW')) {
        if (currentAlert) alerts.push(currentAlert);
        const level = line.match(/(CRITICAL|HIGH|MEDIUM|LOW)/)?.[1] || 'MEDIUM';
        currentAlert = {
          level,
          title: line.replace(/.*?(CRITICAL|HIGH|MEDIUM|LOW):?\s*/, ''),
          description: '',
          actions: [],
          created_at: new Date(),
        };
      } else if (currentAlert && line.trim()) {
        if (line.includes('Maßnahme') || line.includes('Action')) {
          currentAlert.actions.push(line.trim());
        } else {
          currentAlert.description += line.trim() + ' ';
        }
      }
    }
    if (currentAlert) alerts.push(currentAlert);

    logger.info({ 
      alertsGenerated: alerts.length,
      criticalAlerts: alerts.filter(a => a.level === 'CRITICAL').length,
      tokensUsed: result.tokensUsed 
    }, 'Admin alerts generated');

    return {
      alerts,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate admin alerts');
    return { alerts: [], tokensUsed: 0 };
  }
}

/**
 * Helper function to get date based on timeframe
 */
function getTimeFrameDate(timeframe: 'week' | 'month' | 'quarter' | 'all'): Date {
  const now = new Date();
  
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return new Date(0); // Unix epoch
  }
}

/**
 * Batch process multiple admin tasks
 */
export async function batchProcessAdminTasks(
  tasks: Array<{
    type: 'audit' | 'insights' | 'moderation' | 'strategy';
    options?: any;
  }>
): Promise<{ results: Record<string, any>; totalTokensUsed: number }> {
  const results: Record<string, any> = {};
  let totalTokensUsed = 0;

  // Check overall budget
  const estimatedTotalTokens = tasks.length * 1000; // Rough estimate
  const budget = await checkBudget(estimatedTotalTokens);
  
  if (!budget.allowed) {
    logger.warn('Batch admin tasks blocked - insufficient budget');
    throw new Error('AI budget exceeded for batch admin tasks');
  }

  // Process tasks sequentially to manage rate limits
  for (const task of tasks) {
    try {
      let result: any;
      
      switch (task.type) {
        case 'audit':
          result = await performContentAudit(task.options);
          break;
        case 'insights':
          result = await generateUserEngagementInsights(task.options?.timeframe);
          break;
        case 'moderation':
          result = await generateModerationReport(task.options?.timeframe);
          break;
        case 'strategy':
          result = await generateContentStrategy(task.options);
          break;
        default:
          continue;
      }
      
      results[task.type] = result;
      totalTokensUsed += result.tokensUsed;
      
      // Small delay between tasks
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      logger.error({ error, taskType: task.type }, 'Failed to process admin task');
      results[task.type] = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  logger.info({ 
    tasksProcessed: Object.keys(results).length,
    totalTokensUsed,
    avgTokensPerTask: Math.round(totalTokensUsed / tasks.length)
  }, 'Batch admin tasks completed');

  return {
    results,
    totalTokensUsed,
  };
}