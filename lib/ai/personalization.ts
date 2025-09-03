import { z } from 'zod';
import { getAIProvider } from './provider';
import { checkBudget, recordUsage } from './budget';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

// Schemas for personalization responses
export const PersonalizationSchema = z.object({
  recommendations: z.array(z.object({
    postId: z.string(),
    score: z.number().min(0).max(100),
    reason: z.string(),
    category: z.string().optional(),
  })).min(3).max(10),
  userProfile: z.object({
    interests: z.array(z.string()),
    skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    preferredCategories: z.array(z.string()),
    contentTypes: z.array(z.string()),
  }),
});

export const ContentRecommendationSchema = z.object({
  recommendations: z.array(z.string()),
  reasoning: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export const UserSegmentSchema = z.object({
  segment: z.string(),
  characteristics: z.array(z.string()),
  content_preferences: z.array(z.string()),
  engagement_patterns: z.object({
    peak_times: z.array(z.string()),
    preferred_length: z.string(),
    interaction_style: z.string(),
  }),
});

export interface UserBehaviorData {
  userId?: string;
  sessionId?: string;
  readingHistory: Array<{
    postId: string;
    title: string;
    category: string;
    tags: string[];
    readTime: number;
    scrollDepth: number;
    engagement: number;
  }>;
  interactions: Array<{
    type: 'like' | 'comment' | 'share' | 'bookmark';
    postId: string;
    timestamp: Date;
  }>;
  searchHistory: string[];
  timeOnSite: number;
  deviceType: string;
  referrer?: string;
}

export interface PersonalizationContext {
  userAgent?: string;
  location?: string;
  timeOfDay?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  referrer?: string;
  searchIntent?: string;
}

/**
 * Generate personalized content recommendations for a user
 */
export async function generatePersonalizedRecommendations(
  behaviorData: UserBehaviorData,
  context: PersonalizationContext = {},
  count: number = 5
): Promise<{ recommendations: any[]; profile: any; tokensUsed: number }> {
  const estimatedTokens = 1200;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Personalization blocked - insufficient budget');
    throw new Error('AI budget exceeded for personalization');
  }

  const provider = getAIProvider();

  // Get available posts for recommendations
  const availablePosts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      teaser: true,
      tags: { select: { tag: { select: { name: true } } } },
      categories: { select: { category: { select: { name: true } } } },
      contentType: true,
      difficultyLevel: true,
      viewCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const systemPrompt = `Du bist ein KI-Personalisierungs-Experte für einen Tech-Blog.

Analysiere das Nutzerverhalten und erstelle personalisierte Content-Empfehlungen.

ANALYSE-BEREICHE:
- Lesegewohnheiten und Interessen
- Skill-Level basierend auf gelesenen Artikeln
- Bevorzugte Content-Typen und Kategorien
- Engagement-Muster
- Zeitliche Präferenzen
- Device-spezifische Anpassungen

EMPFEHLUNGSLOGIK:
- Ähnliche Themen zu bereits gelesenen Artikeln
- Skill-Level-angepasste Schwierigkeit
- Trending Content berücksichtigen
- Diverse Kategorien für Exploration
- Zeitliche Relevanz
- Anti-Filter-Bubble (gelegentlich neue Bereiche vorschlagen)

QUALITÄTSKRITERIEN:
- Hohe Relevanz für Nutzerinteressen
- Ausgewogene Mischung aus bekannten und neuen Themen
- Verschiedene Content-Längen und -Typen
- Aktualität berücksichtigen`;

  const readingHistoryText = behaviorData.readingHistory
    .map(h => `"${h.title}" (${h.category}, Tags: ${h.tags.join(', ')}, ReadTime: ${h.readTime}min, Engagement: ${h.engagement}/10)`)
    .join('\n');

  const interactionsText = behaviorData.interactions
    .map(i => `${i.type} on post ${i.postId}`)
    .join(', ');

  const availablePostsText = availablePosts
    .map(p => `ID: ${p.id}, Title: "${p.title}", Categories: ${p.categories.map(c => c.category.name).join(',')}, Tags: ${p.tags.map(t => t.tag.name).join(',')}, Type: ${p.contentType}, Difficulty: ${p.difficultyLevel}`)
    .join('\n');

  const userPrompt = `Analysiere folgende Nutzerdaten und erstelle ${count} personalisierte Empfehlungen:

NUTZERVERHALTEN:
Gelesene Artikel:
${readingHistoryText}

Interaktionen: ${interactionsText}
Suchverlauf: ${behaviorData.searchHistory.join(', ')}
Zeit auf Site: ${behaviorData.timeOnSite} Minuten
Device: ${behaviorData.deviceType}

KONTEXT:
${context.timeOfDay ? `Tageszeit: ${context.timeOfDay}` : ''}
${context.deviceType ? `Device-Typ: ${context.deviceType}` : ''}
${context.referrer ? `Referrer: ${context.referrer}` : ''}

VERFÜGBARE POSTS:
${availablePostsText}

Erstelle:
1. ${count} personalisierte Empfehlungen (Post-IDs aus verfügbaren Posts)
2. Detailliertes Nutzerprofil
3. Begründungen für jede Empfehlung

Berücksichtige Nutzerinteressen und variiere Content-Typen für optimale User Experience.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.6,
      maxTokens: 1500,
      jsonSchema: PersonalizationSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    
    // Enrich recommendations with post details
    const enrichedRecommendations = await Promise.all(
      parsed.recommendations.map(async (rec: any) => {
        const post = await prisma.post.findUnique({
          where: { id: rec.postId },
          select: {
            id: true,
            title: true,
            teaser: true,
            slug: true,
            coverImage: true,
            estimatedReadTime: true,
            viewCount: true,
            tags: { select: { tag: { select: { name: true } } } },
            categories: { select: { category: { select: { name: true } } } },
          },
        });

        return {
          ...rec,
          post: post ? {
            ...post,
            tags: post.tags.map(t => t.tag.name),
            categories: post.categories.map(c => c.category.name),
          } : null,
        };
      })
    );

    logger.info({ 
      userId: behaviorData.userId,
      recommendationsCount: enrichedRecommendations.length,
      tokensUsed: result.tokensUsed 
    }, 'Personalized recommendations generated');

    return {
      recommendations: enrichedRecommendations.filter(r => r.post !== null),
      profile: parsed.userProfile,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, userId: behaviorData.userId }, 'Failed to generate personalized recommendations');
    throw error;
  }
}

/**
 * Segment users based on behavior patterns
 */
export async function segmentUser(
  behaviorData: UserBehaviorData
): Promise<{ segment: any; tokensUsed: number }> {
  const estimatedTokens = 600;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('User segmentation blocked - insufficient budget');
    throw new Error('AI budget exceeded for user segmentation');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein User-Segmentierungs-Experte für Tech-Blogs.

Segmentiere Nutzer basierend auf Verhalten in folgende Hauptkategorien:

SEGMENTE:
1. "Tech Enthusiast" - Liest viel, diverse Themen, hohe Engagement
2. "Developer Professional" - Fokus auf praktische Tutorials, Tools
3. "AI/ML Specialist" - Spezialisiert auf KI-Themen
4. "Beginner Learner" - Neue Themen, Basics, längere Lesezeiten
5. "Industry Observer" - News, Trends, kurze Sessions
6. "Problem Solver" - Sucht spezifische Lösungen, zielgerichtet
7. "Academic Researcher" - Tiefe Artikel, wissenschaftlich orientiert
8. "Casual Reader" - Gelegentliche Besuche, populäre Inhalte

ANALYSE-FAKTOREN:
- Lesefrequenz und -dauer
- Content-Typen Präferenzen
- Skill-Level aus gelesenen Artikeln
- Interaction-Patterns
- Session-Verhalten
- Such-Intent

Bestimme das passende Segment mit Begründung.`;

  const behaviorSummary = `
Lesehistorie: ${behaviorData.readingHistory.length} Artikel
Durchschnittliche Lesezeit: ${Math.round(behaviorData.readingHistory.reduce((sum, h) => sum + h.readTime, 0) / behaviorData.readingHistory.length)} min
Interaktionen: ${behaviorData.interactions.length}
Suchbegriffe: ${behaviorData.searchHistory.join(', ')}
Session-Dauer: ${behaviorData.timeOnSite} min
Device: ${behaviorData.deviceType}

Top Kategorien: ${[...new Set(behaviorData.readingHistory.map(h => h.category))].slice(0, 3).join(', ')}
Top Tags: ${[...new Set(behaviorData.readingHistory.flatMap(h => h.tags))].slice(0, 5).join(', ')}
Engagement-Score: ${Math.round(behaviorData.readingHistory.reduce((sum, h) => sum + h.engagement, 0) / behaviorData.readingHistory.length)}/10
`;

  const userPrompt = `Segmentiere folgenden Nutzer:

${behaviorSummary}

Bestimme:
1. Haupt-Segment aus den 8 Kategorien
2. Charakteristische Merkmale
3. Content-Präferenzen
4. Engagement-Muster (peak times, preferred length, interaction style)

Begründe die Segmentierung basierend auf den Verhaltensdaten.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 800,
      jsonSchema: UserSegmentSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ 
      userId: behaviorData.userId,
      segment: parsed.segment,
      tokensUsed: result.tokensUsed 
    }, 'User segmented');

    return {
      segment: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, userId: behaviorData.userId }, 'Failed to segment user');
    throw error;
  }
}

/**
 * Generate newsletter personalization
 */
export async function personalizeNewsletter(
  userId: string,
  availableArticles: any[]
): Promise<{ newsletter: any; tokensUsed: number }> {
  const estimatedTokens = 800;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Newsletter personalization blocked - insufficient budget');
    throw new Error('AI budget exceeded for newsletter personalization');
  }

  // Get user behavior data
  const behaviorData = await getUserBehaviorData(userId);
  if (!behaviorData) {
    throw new Error('Insufficient user data for personalization');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Newsletter-Personalisierungs-Experte.

Kuratiere personalisierte Newsletter-Inhalte basierend auf Nutzerverhalten.

NEWSLETTER-STRUKTUR:
1. Persönliche Begrüßung
2. "Für dich ausgewählt" - 3-4 Hauptartikel
3. "Das könnte dich auch interessieren" - 2-3 weitere Artikel
4. "Trending jetzt" - 1-2 populäre Artikel
5. Persönlicher Abschluss

PERSONALISIERUNG:
- Nutzerinteressen berücksichtigen
- Skill-Level angemessene Inhalte
- Lesegewohnheiten beachten
- Neue Themen zur Exploration einbauen
- Persönlichen Ton verwenden

Ziel: Hohe Öffnungsraten und Klicks durch relevante, personalisierte Inhalte.`;

  const articlesText = availableArticles
    .map(a => `"${a.title}" (${a.categories?.join(',')}) - ${a.teaser}`)
    .join('\n');

  const userPrompt = `Personalisiere Newsletter für Nutzer mit folgendem Profil:

NUTZERVERHALTEN:
${JSON.stringify(behaviorData, null, 2)}

VERFÜGBARE ARTIKEL:
${articlesText}

Erstelle:
1. Personalisierte Artikel-Auswahl (Titel aus verfügbaren Artikeln)
2. Begründung für jede Auswahl
3. Personalisierte Einleitung
4. Empfohlene Betreffzeile
5. Call-to-Actions

Fokussiere auf Relevanz und Nutzer-Engagement.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.6,
      maxTokens: 1000,
    });

    await recordUsage(result.tokensUsed);

    logger.info({ userId, tokensUsed: result.tokensUsed }, 'Newsletter personalized');

    return {
      newsletter: {
        content: result.content,
        personalized: true,
        userId,
        generatedAt: new Date(),
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, userId }, 'Failed to personalize newsletter');
    throw error;
  }
}

/**
 * Real-time content adaptation based on current session
 */
export async function adaptContentForSession(
  sessionData: {
    pagesViewed: string[];
    timeOnSite: number;
    currentPage?: string;
    referrer?: string;
    searchQuery?: string;
    device: string;
  }
): Promise<{ adaptations: any; tokensUsed: number }> {
  const estimatedTokens = 400;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Session adaptation blocked - insufficient budget');
    return { adaptations: null, tokensUsed: 0 };
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Real-time Content-Adaptation-Experte.

Basierend auf aktueller Session, optimiere die Nutzererfahrung:

ADAPTATIONS-BEREICHE:
- Content-Empfehlungen
- CTA-Optimierung
- Newsletter-Popup Timing
- Exit-Intent Strategien
- Navigation-Hilfen
- Related Content

SESSION-ANALYSE:
- Intent-Erkennung (informational, transactional, navigational)
- Engagement-Level
- Content-Präferenzen aus Session
- Device-spezifische Optimierungen
- Verweildauer-Muster

Ziel: Conversion-Rate und User-Experience optimieren.`;

  const sessionSummary = `
Besuchte Seiten: ${sessionData.pagesViewed.join(' -> ')}
Zeit auf Site: ${sessionData.timeOnSite} min
Aktuelle Seite: ${sessionData.currentPage || 'N/A'}
Referrer: ${sessionData.referrer || 'Direct'}
Suchanfrage: ${sessionData.searchQuery || 'N/A'}
Device: ${sessionData.device}
`;

  const userPrompt = `Analysiere Session und erstelle Adaptationen:

${sessionSummary}

Empfehle:
1. Nächste Content-Schritte
2. CTA-Optimierungen
3. Popup/Modal Timing
4. Exit-Intent Strategie
5. Navigation-Verbesserungen

Kurze, actionable Empfehlungen für bessere UX.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.5,
      maxTokens: 600,
    });

    await recordUsage(result.tokensUsed);

    logger.info({ sessionPages: sessionData.pagesViewed.length, tokensUsed: result.tokensUsed }, 'Session adapted');

    return {
      adaptations: {
        recommendations: result.content,
        sessionId: sessionData.pagesViewed.join('-'),
        adaptedAt: new Date(),
      },
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to adapt session');
    return { adaptations: null, tokensUsed: 0 };
  }
}

/**
 * Helper function to get user behavior data
 */
async function getUserBehaviorData(userId: string): Promise<UserBehaviorData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        readingHistory: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                tags: { select: { tag: { select: { name: true } } } },
                categories: { select: { category: { select: { name: true } } } },
              },
            },
          },
          orderBy: { lastAt: 'desc' },
          take: 20,
        },
        articleVotes: {
          include: {
            post: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        comments: {
          include: {
            post: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) return null;

    return {
      userId,
      readingHistory: user.readingHistory.map(h => ({
        postId: h.post.id,
        title: h.post.title,
        category: h.post.categories[0]?.category.name || 'Uncategorized',
        tags: h.post.tags.map(t => t.tag.name),
        readTime: h.minutes,
        scrollDepth: h.lastDepth,
        engagement: Math.min(h.minutes / 5, 10), // Rough engagement score
      })),
      interactions: [
        ...user.articleVotes.map(v => ({
          type: v.type as 'like',
          postId: v.postId,
          timestamp: v.createdAt,
        })),
        ...user.comments.map(c => ({
          type: 'comment' as const,
          postId: c.postId,
          timestamp: c.createdAt,
        })),
      ],
      searchHistory: [], // Would need separate tracking
      timeOnSite: user.readingHistory.reduce((sum, h) => sum + h.minutes, 0),
      deviceType: 'desktop', // Would need to track this
    };
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get user behavior data');
    return null;
  }
}

/**
 * Generate A/B test variations for personalized content
 */
export async function generatePersonalizationABTests(
  baseContent: string,
  userSegments: string[]
): Promise<{ variations: Record<string, any>; tokensUsed: number }> {
  const estimatedTokens = 1000;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Personalization A/B tests blocked - insufficient budget');
    throw new Error('AI budget exceeded for A/B test generation');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Personalisierungs- und A/B-Testing-Experte.

Erstelle segment-spezifische Content-Variationen für verschiedene Nutzergruppen:

SEGMENTE: ${userSegments.join(', ')}

VARIATIONS-BEREICHE:
- Headlines und Titel
- Content-Ton und Ansprache
- Call-to-Actions
- Content-Struktur
- Visual-Empfehlungen
- Personalization-Elemente

Jede Variation soll optimal auf das jeweilige Segment zugeschnitten sein.`;

  const userPrompt = `Erstelle personalisierte Variationen für verschiedene User-Segmente:

BASE CONTENT:
${baseContent}

TARGET SEGMENTS:
${userSegments.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Für jedes Segment erstelle:
- Optimierten Titel
- Angepasste Einleitung
- Segment-spezifische CTAs
- Personalization-Strategie
- Erwartete Performance

Ziel: Höhere Engagement-Raten durch zielgruppenspezifische Ansprache.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.7,
      maxTokens: 1200,
    });

    await recordUsage(result.tokensUsed);

    // Parse variations from response
    const variations: Record<string, any> = {};
    const sections = result.content.split(/\n#{1,3}\s*(Segment|Variation)/i);
    
    userSegments.forEach((segment, index) => {
      const sectionIndex = index + 1;
      if (sections[sectionIndex]) {
        variations[segment] = {
          content: sections[sectionIndex].trim(),
          segment,
          optimizedFor: segment,
          createdAt: new Date(),
        };
      }
    });

    logger.info({ 
      segmentsCount: userSegments.length,
      variationsCreated: Object.keys(variations).length,
      tokensUsed: result.tokensUsed 
    }, 'Personalization A/B tests generated');

    return {
      variations,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, segments: userSegments }, 'Failed to generate personalization A/B tests');
    throw error;
  }
}