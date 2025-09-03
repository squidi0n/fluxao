import { z } from 'zod';
import { getAIProvider } from './provider';
import { checkBudget, recordUsage } from './budget';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

// Schemas for newsletter curation responses
export const NewsletterCurationSchema = z.object({
  newsletter: z.object({
    subject: z.string().min(10).max(100),
    preheader: z.string().min(20).max(150),
    sections: z.array(z.object({
      title: z.string(),
      content: z.string(),
      articles: z.array(z.object({
        title: z.string(),
        summary: z.string(),
        url: z.string().optional(),
        priority: z.number().min(1).max(10),
        reasoning: z.string(),
      })).optional(),
    })),
    call_to_action: z.string(),
    personalization_notes: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    target_audience: z.string(),
    content_mix: z.record(z.number()),
    estimated_read_time: z.number(),
    engagement_score: z.number().min(0).max(100),
  }),
});

export const ContentSummarySchema = z.object({
  summaries: z.array(z.object({
    title: z.string(),
    summary: z.string().min(50).max(200),
    key_points: z.array(z.string()),
    relevance_score: z.number().min(0).max(100),
    target_audience: z.string(),
  })),
});

export const TrendingTopicsSchema = z.object({
  trending: z.array(z.object({
    topic: z.string(),
    relevance_score: z.number().min(0).max(100),
    articles_count: z.number(),
    why_trending: z.string(),
    content_opportunities: z.array(z.string()),
  })),
  recommendations: z.array(z.string()),
});

export interface NewsletterConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  targetAudience: 'beginners' | 'intermediate' | 'advanced' | 'mixed';
  contentMix: {
    news: number;           // 0-100%
    tutorials: number;      // 0-100%
    tools: number;          // 0-100%
    community: number;      // 0-100%
  };
  maxArticles: number;
  includeTrending: boolean;
  includePersonalization: boolean;
  language: 'de' | 'en';
}

export interface ContentSource {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  category: string;
  tags: string[];
  publishedAt: Date;
  author: string;
  url?: string;
  views?: number;
  engagement?: number;
  isInternal: boolean; // Own blog posts vs external sources
}

/**
 * Curate newsletter content automatically based on recent posts and trends
 */
export async function curateNewsletterContent(
  config: NewsletterConfig,
  availableSources: ContentSource[]
): Promise<{ newsletter: any; tokensUsed: number }> {
  const estimatedTokens = 2000;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Newsletter curation blocked - insufficient budget');
    throw new Error('AI budget exceeded for newsletter curation');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Expert Newsletter-Kurator für einen deutschsprachigen Tech-Blog.

Kuratiere automatisch Newsletter-Inhalte basierend auf aktuellen Artikeln und Trends.

NEWSLETTER-ZIELE:
- Hohe Öffnungsraten durch relevante, personalisierte Inhalte
- Ausgewogene Mischung aus News, Tutorials und Tools
- Klare Struktur und hoher Mehrwert
- Engagement-optimierte Betreffzeilen und CTAs

KURATIERUNGS-KRITERIEN:
- Aktualität und Relevanz für Zielgruppe
- Content-Mix entsprechend Konfiguration
- Trending-Topics berücksichtigen
- Eigene vs. externe Inhalte ausbalancieren
- Verschiedene Schwierigkeitsgrade
- Lesezeit-Optimierung

NEWSLETTER-STRUKTUR:
1. Persönliche Begrüßung
2. "Diese Woche im Fokus" (Top-Story)
3. "Neu auf dem Blog" (eigene Artikel)
4. "Trending Tools & News" (externe Quellen)
5. "Community Spotlight"
6. Call-to-Action

Sprache: ${config.language === 'de' ? 'Deutsch' : 'English'}`;

  const sourcesText = availableSources
    .slice(0, 30) // Limit for token management
    .map(s => `"${s.title}" (${s.category}, ${s.isInternal ? 'Internal' : 'External'}, ${s.views || 0} views, Published: ${s.publishedAt.toISOString().split('T')[0]}) - ${s.summary || 'No summary'}`)
    .join('\n');

  const configText = `
Frequenz: ${config.frequency}
Zielgruppe: ${config.targetAudience}
Content-Mix: News ${config.contentMix.news}%, Tutorials ${config.contentMix.tutorials}%, Tools ${config.contentMix.tools}%, Community ${config.contentMix.community}%
Max Artikel: ${config.maxArticles}
Trending einbeziehen: ${config.includeTrending ? 'Ja' : 'Nein'}
Personalisierung: ${config.includePersonalization ? 'Ja' : 'Nein'}
`;

  const userPrompt = `Kuratiere Newsletter mit folgender Konfiguration:

${configText}

VERFÜGBARE INHALTE:
${sourcesText}

Erstelle:
1. Engagement-optimierten Betreff (A/B-Test-tauglich)
2. Ansprechenden Preheader
3. Strukturierten Newsletter mit Sektionen
4. Artikel-Auswahl mit Begründungen
5. Personalisierte CTAs
6. Metadata für Performance-Tracking

Fokus: Hoher Mehrwert für Leser, optimiert für ${config.targetAudience}-Niveau.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.6,
      maxTokens: 2500,
      jsonSchema: NewsletterCurationSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    
    // Enrich with actual URLs from sources
    if (parsed.newsletter.sections) {
      for (const section of parsed.newsletter.sections) {
        if (section.articles) {
          for (const article of section.articles) {
            const source = availableSources.find(s => 
              s.title.toLowerCase().includes(article.title.toLowerCase()) ||
              article.title.toLowerCase().includes(s.title.toLowerCase())
            );
            if (source && source.url) {
              article.url = source.url;
            }
          }
        }
      }
    }

    logger.info({ 
      frequency: config.frequency,
      articlesSelected: parsed.newsletter.sections?.reduce((sum: number, s: any) => sum + (s.articles?.length || 0), 0) || 0,
      tokensUsed: result.tokensUsed 
    }, 'Newsletter curated');

    return {
      newsletter: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, frequency: config.frequency }, 'Failed to curate newsletter');
    throw error;
  }
}

/**
 * Generate personalized newsletter variations for different user segments
 */
export async function generatePersonalizedNewsletterVariations(
  baseNewsletter: any,
  userSegments: string[]
): Promise<{ variations: Record<string, any>; tokensUsed: number }> {
  const estimatedTokens = 1200;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Newsletter personalization blocked - insufficient budget');
    throw new Error('AI budget exceeded for newsletter personalization');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Newsletter-Personalisierungs-Experte.

Erstelle segment-spezifische Newsletter-Variationen aus einem Base-Newsletter.

PERSONALISIERUNGS-BEREICHE:
- Betreffzeilen (segment-spezifische Appeals)
- Content-Prioritäten (was zuerst gezeigt wird)
- Ton und Ansprache (formal vs. casual)
- Artikel-Auswahl und -Reihenfolge
- CTAs und Handlungsaufforderungen
- Zusätzliche segment-spezifische Inhalte

SEGMENTE UND ANSPRACHE:
- Beginners: Einfache Erklärungen, Step-by-Step, ermutigend
- Professionals: Efficiency-focused, advanced tools, time-saving
- Entrepreneurs: Business-impact, ROI, scaling-focused
- Researchers: Deep-dives, latest developments, academic tone

Ziel: Höhere Öffnungsraten und Engagement durch zielgruppengenaue Ansprache.`;

  const baseContent = JSON.stringify(baseNewsletter, null, 2).slice(0, 1000);

  const userPrompt = `Erstelle personalisierte Variationen des Base-Newsletters für folgende Segmente:

SEGMENTE: ${userSegments.join(', ')}

BASE-NEWSLETTER:
${baseContent}...

Für jedes Segment erstelle:
1. Optimierte Betreffzeile
2. Angepasste Begrüßung
3. Segment-spezifische Artikel-Prioritäten
4. Passende Tonalität
5. Zielgruppen-optimierte CTAs
6. Zusätzliche relevante Inhalte

Behalte Kern-Content bei, ändere aber Präsentation und Fokus für optimale Segment-Ansprache.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.7,
      maxTokens: 1500,
    });

    await recordUsage(result.tokensUsed);

    // Parse variations from the response
    const variations: Record<string, any> = {};
    const sections = result.content.split(/\n#{1,3}\s*(Segment|Variation)/i);
    
    userSegments.forEach((segment, index) => {
      const sectionIndex = index + 1;
      if (sections[sectionIndex]) {
        const content = sections[sectionIndex].trim();
        
        // Extract subject line, greeting, and CTAs from content
        const subjectMatch = content.match(/Betreff(?:zeile)?:\s*(.+)/i);
        const greetingMatch = content.match(/Begrüßung:\s*(.+)/i);
        const ctaMatch = content.match(/CTA:\s*(.+)/i);
        
        variations[segment] = {
          segment,
          subject: subjectMatch?.[1] || baseNewsletter.newsletter?.subject,
          greeting: greetingMatch?.[1] || 'Hallo',
          cta: ctaMatch?.[1] || baseNewsletter.newsletter?.call_to_action,
          content_adjustments: content,
          personalized_at: new Date(),
        };
      }
    });

    logger.info({ 
      segmentsProcessed: userSegments.length,
      variationsCreated: Object.keys(variations).length,
      tokensUsed: result.tokensUsed 
    }, 'Newsletter variations generated');

    return {
      variations,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, segments: userSegments }, 'Failed to generate newsletter variations');
    throw error;
  }
}

/**
 * Analyze trending topics from various sources
 */
export async function analyzeTrendingTopics(
  sources: {
    internalPosts: ContentSource[];
    externalFeeds?: string[]; // RSS feeds, news sources
    socialMedia?: any[]; // Social media mentions
    searchTrends?: string[]; // Search trend data
  }
): Promise<{ trends: any; tokensUsed: number }> {
  const estimatedTokens = 800;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Trending topics analysis blocked - insufficient budget');
    throw new Error('AI budget exceeded for trending analysis');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Trend-Analyst für Tech-Content und Newsletter-Kuration.

Analysiere verschiedene Datenquellen um aktuelle Tech-Trends zu identifizieren.

TREND-KATEGORIEN:
- Emerging Technologies (KI, Blockchain, IoT, etc.)
- Development Tools und Frameworks
- Industry News und Updates
- Community Discussions
- Search Volume Trends

BEWERTUNGSKRITERIEN:
- Relevanz für Tech-Community
- Zeitliche Dringlichkeit (breaking news vs. evergreen)
- Newsletter-Tauglichkeit
- Zielgruppen-Interesse
- Content-Opportunity-Potential

Fokus: Newsletter-relevante Trends mit hohem Engagement-Potential.`;

  const internalPostsText = sources.internalPosts
    .slice(0, 20)
    .map(p => `"${p.title}" (${p.category}, ${p.views} views, ${p.tags.join(', ')})`)
    .join('\n');

  const externalSourcesText = sources.externalFeeds?.join(', ') || 'None provided';
  const searchTrendsText = sources.searchTrends?.join(', ') || 'None provided';

  const userPrompt = `Analysiere Trends aus folgenden Quellen:

EIGENE BLOG-POSTS (Performance-Data):
${internalPostsText}

EXTERNE QUELLEN:
${externalSourcesText}

SEARCH TRENDS:
${searchTrendsText}

Identifiziere:
1. Top 5-8 trending Topics
2. Relevanz-Scores (0-100)
3. Warum sie gerade trending sind
4. Newsletter-Content-Opportunities
5. Empfehlungen für Content-Erstellung

Fokussiere auf aktuelle, newsletter-taugliche Trends mit hohem Engagement-Potential.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.5,
      maxTokens: 1000,
      jsonSchema: TrendingTopicsSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      trendsIdentified: parsed.trending.length,
      internalPostsAnalyzed: sources.internalPosts.length,
      tokensUsed: result.tokensUsed 
    }, 'Trending topics analyzed');

    return {
      trends: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to analyze trending topics');
    throw error;
  }
}

/**
 * Generate content summaries for newsletter inclusion
 */
export async function generateContentSummaries(
  articles: ContentSource[],
  maxLength: number = 150
): Promise<{ summaries: any[]; tokensUsed: number }> {
  const estimatedTokens = 1000;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Content summaries blocked - insufficient budget');
    throw new Error('AI budget exceeded for content summaries');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Content-Zusammenfassungs-Experte für Newsletter.

Erstelle prägnante, engaging Zusammenfassungen für Newsletter-Artikel.

ZUSAMMENFASSUNGS-KRITERIEN:
- Max. ${maxLength} Zeichen
- Klarer Mehrwert kommunizieren
- Neugierig machen ohne zu viel zu verraten
- Call-to-Action integrieren
- Zielgruppen-gerecht formulieren

STIL:
- Aktiv statt passiv
- Konkrete Benefits statt abstrakte Begriffe
- Emotionale Hooks wo passend
- Klartext statt Marketing-Speak

Ziel: Newsletter-Leser zum Klicken motivieren.`;

  const articlesText = articles
    .slice(0, 10) // Limit for token management
    .map(a => `"${a.title}" (${a.category}): ${a.content?.slice(0, 500) || a.summary || 'No content available'}`)
    .join('\n\n');

  const userPrompt = `Erstelle Newsletter-Summaries für folgende Artikel:

${articlesText}

Für jeden Artikel erstelle:
1. Engaging Summary (max. ${maxLength} Zeichen)
2. 3-5 Key Points als Bullet Points
3. Relevanz-Score für Newsletter (0-100)
4. Zielgruppen-Empfehlung

Fokus: Hohe Click-Through-Rates durch interessante, wertvolle Summaries.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.6,
      maxTokens: 1200,
      jsonSchema: ContentSummarySchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    
    // Enrich summaries with original article data
    const enrichedSummaries = parsed.summaries.map((summary: any, index: number) => ({
      ...summary,
      original_article: articles[index] || null,
      generated_at: new Date(),
    }));

    logger.info({ 
      articlesProcessed: articles.length,
      summariesGenerated: parsed.summaries.length,
      tokensUsed: result.tokensUsed 
    }, 'Content summaries generated');

    return {
      summaries: enrichedSummaries,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate content summaries');
    throw error;
  }
}

/**
 * Optimize newsletter subject lines for higher open rates
 */
export async function optimizeSubjectLines(
  baseSubject: string,
  audience: string,
  testType: 'emotional' | 'curiosity' | 'urgency' | 'benefit' | 'all' = 'all'
): Promise<{ variations: any[]; tokensUsed: number }> {
  const estimatedTokens = 600;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Subject line optimization blocked - insufficient budget');
    throw new Error('AI budget exceeded for subject line optimization');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Email-Marketing und Subject-Line-Optimierungs-Experte.

Erstelle A/B-Test-Variationen für Newsletter-Betreffzeilen.

OPTIMIERUNGS-STRATEGIEN:
- Emotional: Emotionale Trigger und persönliche Ansprache
- Curiosity: Neugier-Gaps und offene Fragen
- Urgency: Zeitdruck und FOMO-Elemente
- Benefit: Klare Vorteile und Mehrwert
- Numbers: Spezifische Zahlen und Fakten
- Personalization: Personalisierte Ansprache

BEST PRACTICES:
- 30-50 Zeichen optimal
- Aktive Sprache verwenden
- Spam-Wörter vermeiden
- Mobile-optimiert
- A/B-Test-tauglich

Ziel: Messbar höhere Öffnungsraten durch optimierte Subject Lines.`;

  const strategiesList = testType === 'all' 
    ? ['emotional', 'curiosity', 'urgency', 'benefit', 'numbers']
    : [testType];

  const userPrompt = `Optimiere folgenden Newsletter-Betreff:

ORIGINAL: "${baseSubject}"
ZIELGRUPPE: ${audience}
TEST-STRATEGIEN: ${strategiesList.join(', ')}

Erstelle für jede Strategie 2-3 Variationen:
1. Subject Line Variation
2. Strategie-Begründung
3. Erwartete Performance
4. A/B-Test-Empfehlung

Fokus: Messbar höhere Open-Rates durch psychologisch optimierte Betreffzeilen.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.7,
      maxTokens: 800,
    });

    await recordUsage(result.tokensUsed);

    // Parse variations from the response
    const variations: any[] = [];
    const lines = result.content.split('\n').filter(line => line.trim());
    
    let currentStrategy = '';
    for (const line of lines) {
      if (strategiesList.some(s => line.toLowerCase().includes(s))) {
        currentStrategy = strategiesList.find(s => line.toLowerCase().includes(s)) || '';
      } else if (line.includes('"') && currentStrategy) {
        const subjectMatch = line.match(/"([^"]+)"/);
        if (subjectMatch) {
          variations.push({
            subject: subjectMatch[1],
            strategy: currentStrategy,
            original: baseSubject,
            audience,
            generated_at: new Date(),
          });
        }
      }
    }

    logger.info({ 
      originalSubject: baseSubject,
      variationsGenerated: variations.length,
      strategies: strategiesList,
      tokensUsed: result.tokensUsed 
    }, 'Subject lines optimized');

    return {
      variations,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, baseSubject }, 'Failed to optimize subject lines');
    throw error;
  }
}

/**
 * Schedule and manage automated newsletter curation
 */
export async function scheduleAutomatedCuration(
  config: NewsletterConfig & {
    scheduleTime: string; // e.g., "09:00"
    timeZone: string;     // e.g., "Europe/Berlin"
    enabled: boolean;
  }
): Promise<{ success: boolean; nextRun?: Date }> {
  try {
    // Store configuration in database
    await prisma.setting.upsert({
      where: { key: 'newsletter_auto_curation_config' },
      create: {
        key: 'newsletter_auto_curation_config',
        value: JSON.stringify(config),
      },
      update: {
        value: JSON.stringify(config),
      },
    });

    // Calculate next run time based on frequency
    let nextRun: Date;
    const now = new Date();
    
    switch (config.frequency) {
      case 'daily':
        nextRun = new Date(now);
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextRun = new Date(now);
        nextRun.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextRun = new Date(now);
        nextRun.setMonth(now.getMonth() + 1);
        break;
      default:
        nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // Set time
    const [hour, minute] = config.scheduleTime.split(':').map(Number);
    nextRun.setHours(hour, minute, 0, 0);

    logger.info({ 
      frequency: config.frequency,
      nextRun: nextRun.toISOString(),
      enabled: config.enabled 
    }, 'Newsletter automation scheduled');

    return {
      success: true,
      nextRun: config.enabled ? nextRun : undefined,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to schedule newsletter automation');
    return { success: false };
  }
}

/**
 * Execute automated newsletter curation (called by scheduled job)
 */
export async function executeAutomatedCuration(): Promise<{ 
  success: boolean; 
  newsletter?: any; 
  error?: string 
}> {
  try {
    // Get configuration
    const configSetting = await prisma.setting.findUnique({
      where: { key: 'newsletter_auto_curation_config' },
    });

    if (!configSetting) {
      throw new Error('Newsletter automation not configured');
    }

    const config = JSON.parse(configSetting.value) as NewsletterConfig;

    // Get recent content sources
    const recentPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        author: { select: { name: true } },
        categories: { select: { category: { select: { name: true } } } },
        tags: { select: { tag: { select: { name: true } } } },
        postAnalytics: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });

    const contentSources: ContentSource[] = recentPosts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content?.slice(0, 1000),
      summary: post.summary || undefined,
      category: post.categories[0]?.category.name || 'General',
      tags: post.tags.map(t => t.tag.name),
      publishedAt: post.publishedAt || post.createdAt,
      author: post.author.name || 'Anonymous',
      url: `/blog/${post.slug}`,
      views: post.postAnalytics?.views || 0,
      engagement: post.postAnalytics?.engagementScore || 0,
      isInternal: true,
    }));

    // Curate newsletter
    const result = await curateNewsletterContent(config, contentSources);

    // Save as draft
    const draft = await prisma.newsletterDraft.create({
      data: {
        date: new Date(),
        subject: result.newsletter.newsletter.subject,
        intro: result.newsletter.newsletter.sections?.[0]?.content || '',
        topics: result.newsletter.newsletter.sections || [],
        status: 'draft',
      },
    });

    logger.info({ 
      draftId: draft.id,
      subject: draft.subject,
      sectionsCount: Array.isArray(draft.topics) ? draft.topics.length : 0
    }, 'Automated newsletter curated');

    return {
      success: true,
      newsletter: {
        ...result.newsletter,
        draftId: draft.id,
      },
    };
  } catch (error) {
    logger.error({ error }, 'Failed to execute automated curation');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}