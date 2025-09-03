import { z } from 'zod';
import { getAIProvider, GenerateOptions } from './provider';
import { checkBudget, recordUsage } from './budget';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

// Schemas for structured AI responses
export const BlogPostSchema = z.object({
  title: z.string().min(10).max(100),
  teaser: z.string().min(50).max(200),
  content: z.string().min(500),
  tags: z.array(z.string()).min(3).max(8),
  category: z.string(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  estimatedReadTime: z.number().min(1).max(30),
});

export const ContentIdeaSchema = z.object({
  ideas: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    difficulty: z.string(),
    tags: z.array(z.string()),
    trending_score: z.number().min(0).max(100),
  })).min(5).max(10),
});

export const SEOOptimizationSchema = z.object({
  meta_title: z.string().max(60),
  meta_description: z.string().max(160),
  slug: z.string().max(100),
  keywords: z.array(z.string()).min(5).max(15),
  readability_score: z.number().min(0).max(100),
  seo_recommendations: z.array(z.string()),
});

export interface ContentGenerationOptions {
  topic?: string;
  category?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  targetAudience?: string;
  length?: 'short' | 'medium' | 'long';
  style?: 'tutorial' | 'news' | 'opinion' | 'interview' | 'review';
  includeCode?: boolean;
  language?: 'de' | 'en';
}

export interface TrendingTopics {
  topics: Array<{
    topic: string;
    relevance: number;
    search_volume: number;
    difficulty: string;
    content_gaps: string[];
  }>;
}

/**
 * Generate blog post ideas based on trending topics and content gaps
 */
export async function generateContentIdeas(
  count: number = 5,
  category?: string
): Promise<{ ideas: any[]; tokensUsed: number }> {
  const estimatedTokens = 1000;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Content ideas generation blocked - insufficient budget');
    throw new Error('AI budget exceeded for content generation');
  }

  const provider = getAIProvider();
  
  // Get recent posts to avoid duplication
  const recentPosts = await prisma.post.findMany({
    where: category ? {
      categories: {
        some: {
          category: {
            slug: category
          }
        }
      }
    } : undefined,
    select: { title: true, tags: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const recentTitles = recentPosts.map(p => p.title).join(', ');
  const recentTags = [...new Set(recentPosts.flatMap(p => p.tags.map(t => t.tag.name)))];

  const systemPrompt = `Du bist ein Content-Stratege für einen deutschsprachigen Tech-Blog über KI, Machine Learning und Technologie.

Generiere ${count} innovative Blog-Post-Ideen, die:
- Aktuell und relevant für 2024/2025 sind
- Unterschiedliche Schwierigkeitsgrade abdecken
- Spezifisch und umsetzbar sind
- Nicht bereits behandelt wurden

Kürzlich behandelte Themen (zu vermeiden): ${recentTitles}
Häufig verwendete Tags: ${recentTags.slice(0, 10).join(', ')}

${category ? `Fokus-Kategorie: ${category}` : 'Alle Tech-Kategorien berücksichtigen'}

Berücksichtige aktuelle Trends:
- KI-Tools und -Anwendungen
- Cloud-Computing und DevOps
- Cybersecurity
- Blockchain und Web3
- Mobile Development
- Frontend/Backend Frameworks
- Data Science und Analytics

Antworte im JSON-Format mit strukturierten Ideen.`;

  const userPrompt = `Generiere ${count} Blog-Post-Ideen mit folgenden Informationen:
- Titel (prägnant und SEO-optimiert)
- Beschreibung (2-3 Sätze)
- Kategorie
- Schwierigkeitsgrad (Beginner/Intermediate/Advanced)
- 3-5 relevante Tags
- Trending Score (0-100, wie aktuell/relevant das Thema ist)

Fokussiere auf praktische, umsetzbare Inhalte die Lesern echten Wert bieten.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.8,
      maxTokens: 1500,
      jsonSchema: ContentIdeaSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ count: parsed.ideas.length, tokensUsed: result.tokensUsed }, 'Content ideas generated');

    return {
      ideas: parsed.ideas,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate content ideas');
    throw error;
  }
}

/**
 * Generate complete blog post from title/topic
 */
export async function generateBlogPost(
  title: string,
  options: ContentGenerationOptions = {}
): Promise<{ post: any; tokensUsed: number }> {
  const estimatedTokens = 2500;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Blog post generation blocked - insufficient budget');
    throw new Error('AI budget exceeded for content generation');
  }

  const {
    category = 'AI & Machine Learning',
    difficulty = 'INTERMEDIATE',
    targetAudience = 'Tech-interessierte Entwickler und IT-Professionals',
    length = 'medium',
    style = 'tutorial',
    includeCode = true,
    language = 'de'
  } = options;

  const provider = getAIProvider();

  const lengthGuidance = {
    short: '800-1200 Wörter',
    medium: '1200-1800 Wörter', 
    long: '1800-2500 Wörter'
  };

  const systemPrompt = `Du bist ein erfahrener Tech-Blogger und Content-Creator für einen deutschsprachigen Blog über Technologie, KI und Entwicklung.

Schreibe einen vollständigen, professionellen Blog-Post mit folgenden Anforderungen:

STIL & QUALITÄT:
- Informativer, aber zugänglicher Schreibstil
- Klare Struktur mit Überschriften und Absätzen
- ${targetAudience} als Zielgruppe
- Schwierigkeitsgrad: ${difficulty}
- Länge: ${lengthGuidance[length]}
- Artikel-Typ: ${style}

TECHNISCHE ANFORDERUNGEN:
- Markdown-Format verwenden
- ${includeCode ? 'Code-Beispiele einbauen wo sinnvoll' : 'Keine Code-Beispiele'}
- Deutsche Sprache, aber englische Fachbegriffe wo etabliert
- SEO-optimiert mit relevanten Keywords
- Praktische Beispiele und Anwendungsfälle

STRUKTUR:
1. Einleitung (Problem/Relevanz)
2. Hauptinhalt (Lösungen/Erklärungen)
3. Praktische Beispiele
4. Fazit und Ausblick

Der Post soll echten Mehrwert bieten und aktuell sein.`;

  const userPrompt = `Schreibe einen Blog-Post zum Thema: "${title}"

Kategorie: ${category}

Behandle folgende Punkte:
- Was ist das Problem/die Herausforderung?
- Warum ist das Thema relevant?
- Wie können Leser das praktisch anwenden?
- Welche Tools/Technologien sind relevant?
- Was sind die nächsten Schritte?

Antworte mit einem vollständigen Artikel in JSON-Format.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.7,
      maxTokens: 3000,
      jsonSchema: BlogPostSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    
    // Add estimated read time calculation
    const wordCount = parsed.content.split(/\s+/).length;
    parsed.estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed

    logger.info({ 
      title: parsed.title,
      wordCount,
      tokensUsed: result.tokensUsed 
    }, 'Blog post generated');

    return {
      post: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, title }, 'Failed to generate blog post');
    throw error;
  }
}

/**
 * Optimize existing content for SEO
 */
export async function optimizeForSEO(
  title: string,
  content: string
): Promise<{ optimization: any; tokensUsed: number }> {
  const estimatedTokens = 800;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('SEO optimization blocked - insufficient budget');
    throw new Error('AI budget exceeded for SEO optimization');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein SEO-Experte für deutschsprachige Tech-Blogs.

Analysiere den gegebenen Content und optimiere ihn für Suchmaschinen.

AUFGABEN:
- Meta-Title erstellen (max. 60 Zeichen, clickbait-optimiert)
- Meta-Description schreiben (max. 160 Zeichen, Call-to-Action)
- SEO-freundlichen Slug generieren
- Relevante Keywords identifizieren (primäre und sekundäre)
- Lesbarkeits-Score bewerten (0-100)
- Konkrete Verbesserungsvorschläge

KRITERIEN:
- Deutsche Keywords bevorzugen, englische Fachbegriffe wo etabliert
- Long-tail Keywords berücksichtigen
- User Intent beachten (informational, transactional, navigational)
- Featured Snippet Optimierung
- Mobile-first Ansatz`;

  const userPrompt = `Optimiere folgenden Blog-Post für SEO:

Titel: ${title}

Content: ${content.slice(0, 2000)}...

Analysiere den Inhalt und generiere:
1. Optimierten Meta-Title
2. Ansprechende Meta-Description  
3. SEO-Slug
4. Keyword-Liste (primär + sekundär)
5. Lesbarkeits-Score
6. Konkrete Verbesserungsvorschläge`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.3,
      maxTokens: 1000,
      jsonSchema: SEOOptimizationSchema,
    });

    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    logger.info({ title, tokensUsed: result.tokensUsed }, 'SEO optimization generated');

    return {
      optimization: parsed,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, title }, 'Failed to generate SEO optimization');
    throw error;
  }
}

/**
 * Generate social media content from blog post
 */
export async function generateSocialContent(
  title: string,
  content: string,
  platforms: string[] = ['twitter', 'linkedin', 'facebook']
): Promise<{ social: Record<string, any>; tokensUsed: number }> {
  const estimatedTokens = 600;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Social content generation blocked - insufficient budget');
    throw new Error('AI budget exceeded for social content generation');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Social Media Manager für einen Tech-Blog.

Erstelle plattformspezifische Posts aus Blog-Inhalten:

TWITTER/X:
- Max. 280 Zeichen
- Hashtags integrieren (#KI #TechNews #DevCommunity)
- Emoji sparsam einsetzen
- Call-to-Action für Link-Klick

LINKEDIN:
- Professioneller Ton
- 150-300 Wörter
- Fragen zur Engagement-Steigerung
- Business-fokussiert

FACEBOOK:
- Conversational tone
- Story-telling Ansatz
- Community-Building
- Visual content suggestions

Jeder Post soll neugierig auf den vollständigen Artikel machen.`;

  const platformsStr = platforms.join(', ');
  const userPrompt = `Erstelle Social Media Posts für: ${platformsStr}

Blog-Post: "${title}"

Content-Zusammenfassung: ${content.slice(0, 500)}...

Generiere für jede Plattform:
- Ansprechenden Post-Text
- Relevante Hashtags
- Call-to-Action
- Visual-Vorschläge (wenn relevant)

Ziel: Traffic zum Blog-Post generieren und Engagement fördern.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.6,
      maxTokens: 800,
    });

    await recordUsage(result.tokensUsed);

    // Parse the response manually as it's not structured JSON
    const socialContent: Record<string, any> = {};
    const lines = result.content.split('\n');
    let currentPlatform = '';
    
    for (const line of lines) {
      if (line.toLowerCase().includes('twitter') || line.toLowerCase().includes('x:')) {
        currentPlatform = 'twitter';
        socialContent[currentPlatform] = {};
      } else if (line.toLowerCase().includes('linkedin')) {
        currentPlatform = 'linkedin';
        socialContent[currentPlatform] = {};
      } else if (line.toLowerCase().includes('facebook')) {
        currentPlatform = 'facebook';
        socialContent[currentPlatform] = {};
      } else if (currentPlatform && line.trim()) {
        if (!socialContent[currentPlatform].content) {
          socialContent[currentPlatform].content = line.trim();
        }
      }
    }

    logger.info({ platforms, tokensUsed: result.tokensUsed }, 'Social content generated');

    return {
      social: socialContent,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, title }, 'Failed to generate social content');
    throw error;
  }
}

/**
 * Generate content variations (A/B testing)
 */
export async function generateContentVariations(
  originalTitle: string,
  originalContent: string,
  variationCount: number = 3
): Promise<{ variations: any[]; tokensUsed: number }> {
  const estimatedTokens = 1200;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Content variations blocked - insufficient budget');
    throw new Error('AI budget exceeded for content variations');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Content-Optimierungsexperte.

Erstelle ${variationCount} verschiedene Versionen des gegebenen Contents für A/B Testing:

VARIATION TYPES:
1. Emotional/Personal - mehr Storytelling, persönliche Ansprache
2. Technical/Factual - faktenorientiert, präzise, wissenschaftlich
3. Action-Oriented - handlungsorientiert, praktische Schritte

ANPASSUNGEN:
- Unterschiedliche Titel (Hook-Variationen)
- Verschiedene Einleitungen
- Andere Struktur/Reihenfolge
- Unterschiedlicher Ton
- Verschiedene CTAs

Ziel: Herausfinden welcher Ansatz bessere Engagement-Raten erzielt.`;

  const userPrompt = `Erstelle ${variationCount} Variationen für:

Original-Titel: "${originalTitle}"

Original-Content: ${originalContent.slice(0, 1000)}...

Für jede Variation generiere:
- Alternativen Titel
- Neue Einleitung (erste 2-3 Absätze)
- Variation-Typ-Beschreibung
- Erwartete Zielgruppen-Resonanz

Behalte den Kerninhalt bei, ändere aber Präsentation und Ansprache.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.8,
      maxTokens: 1500,
    });

    await recordUsage(result.tokensUsed);

    // Parse variations from the response
    const variations: any[] = [];
    const sections = result.content.split(/\n#{1,3}\s*Variation\s*\d+/i);
    
    for (let i = 1; i < sections.length && i <= variationCount; i++) {
      const section = sections[i].trim();
      const lines = section.split('\n').filter(line => line.trim());
      
      variations.push({
        id: i,
        title: lines.find(line => line.toLowerCase().includes('titel'))?.split(':')[1]?.trim() || `${originalTitle} (Variation ${i})`,
        introduction: lines.slice(1, 4).join('\n'),
        type: lines.find(line => line.toLowerCase().includes('typ'))?.split(':')[1]?.trim() || 'Standard',
        target_audience: lines.find(line => line.toLowerCase().includes('zielgruppe'))?.split(':')[1]?.trim() || 'Allgemein'
      });
    }

    logger.info({ variationCount: variations.length, tokensUsed: result.tokensUsed }, 'Content variations generated');

    return {
      variations,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, originalTitle }, 'Failed to generate content variations');
    throw error;
  }
}

/**
 * Generate trending topic analysis
 */
export async function analyzeTrendingTopics(
  category?: string,
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<{ trends: TrendingTopics; tokensUsed: number }> {
  const estimatedTokens = 800;
  const budget = await checkBudget(estimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Trending topics analysis blocked - insufficient budget');
    throw new Error('AI budget exceeded for trend analysis');
  }

  const provider = getAIProvider();

  const systemPrompt = `Du bist ein Tech-Trend-Analyst und Content-Strategie-Experte.

Analysiere aktuelle Trends im Tech-Bereich für Content-Erstellung:

ANALYSE-BEREICHE:
- Emerging Technologies (KI, Blockchain, IoT, etc.)
- Development Frameworks und Tools
- Industry News und Updates
- Community Diskussionen
- Search Volume Trends
- Competitive Landscape

BEWERTUNGSKRITERIEN:
- Relevanz für deutsche Tech-Community
- Content-Potential und Suchvolumen
- Schwierigkeitsgrad für Ranking
- Content-Gap-Analyse
- Zeitliche Relevanz

Fokus: Themen die sich gut für Blog-Posts eignen und Traffic generieren.`;

  const userPrompt = `Analysiere Tech-Trends für Content-Erstellung:

${category ? `Kategorie-Fokus: ${category}` : 'Alle Tech-Kategorien'}
Zeitraum: ${timeframe}

Identifiziere 8-10 trending Topics mit:
- Topic Name
- Relevanz-Score (0-100)
- Geschätztes Suchvolumen
- Content-Schwierigkeit 
- Identifizierte Content-Gaps

Priorisiere Themen mit hohem Traffic-Potential und geringer Konkurrenz.`;

  try {
    const result = await provider.generate({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 1000,
    });

    await recordUsage(result.tokensUsed);

    // Parse trends from response
    const trends: TrendingTopics = { topics: [] };
    const lines = result.content.split('\n');
    
    for (const line of lines) {
      if (line.includes('Topic:') || line.includes('Thema:')) {
        const topicMatch = line.match(/(?:Topic|Thema):\s*(.+)/i);
        if (topicMatch) {
          trends.topics.push({
            topic: topicMatch[1].trim(),
            relevance: 75, // Default values - would be parsed from actual response
            search_volume: 1000,
            difficulty: 'Medium',
            content_gaps: ['Tutorial needed', 'Practical examples missing']
          });
        }
      }
    }

    logger.info({ trendsCount: trends.topics.length, tokensUsed: result.tokensUsed }, 'Trending topics analyzed');

    return {
      trends,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error({ error, category }, 'Failed to analyze trending topics');
    throw error;
  }
}

/**
 * Batch content generation for multiple topics
 */
export async function generateContentBatch(
  topics: string[],
  options: ContentGenerationOptions = {}
): Promise<{ posts: any[]; totalTokensUsed: number }> {
  const estimatedTokensPerPost = 2500;
  const totalEstimatedTokens = topics.length * estimatedTokensPerPost;
  
  const budget = await checkBudget(totalEstimatedTokens);
  
  if (!budget.allowed) {
    logger.warn('Batch content generation blocked - insufficient budget');
    throw new Error('AI budget exceeded for batch content generation');
  }

  const provider = getAIProvider();
  const posts: any[] = [];
  let totalTokensUsed = 0;

  // Generate posts with rate limiting
  for (const topic of topics) {
    try {
      const result = await generateBlogPost(topic, options);
      posts.push(result.post);
      totalTokensUsed += result.tokensUsed;
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info({ topic, postsGenerated: posts.length }, 'Batch post generated');
    } catch (error) {
      logger.error({ error, topic }, 'Failed to generate post in batch');
      // Continue with other topics
    }
  }

  logger.info({ 
    totalPosts: posts.length, 
    totalTokensUsed,
    averageTokensPerPost: Math.round(totalTokensUsed / posts.length)
  }, 'Batch content generation completed');

  return {
    posts,
    totalTokensUsed,
  };
}