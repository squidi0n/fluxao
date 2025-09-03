import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { AIProviderManager } from '@/lib/ai/provider-manager';
import { MasterPromptSystem } from '@/lib/ai/master-prompt';
import { SecurityValidator } from '@/lib/ai/security';

// Writer configuration schema
const WriterConfigSchema = z.object({
  provider: z.enum(['claude', 'openai', 'gemini', 'llama', 'cohere']).default('claude'),
  model: z.string().optional(),
  category: z.string().default('KI & Tech'),
  title: z.string().min(1),
  length: z.number().min(200).max(5000).default(1200),
  tone: z.enum([
    'analytisch-kühl',
    'optimistisch-visionär',
    'kritisch-hinterfragend',
    'neutral-sachlich',
    'emotional-engagiert'
  ]).default('analytisch-kühl'),
  thinker: z.enum([
    'Kurzweil', 'Harari', 'Bostrom', 'Hassabis', 'Kelly', 'Tegmark',
    'Zuboff', 'Lanier', 'Musk', 'Altman', 'LeCun', 'Wolfram',
    'Thiel', 'Andreessen', 'Chomsky', 'Pinker', 'Taleb', 'Gladwell',
    'Mix', 'Auto'
  ]).default('Auto'),
  hook: z.enum([
    'Überraschende Statistik',
    'Provokante These',
    'Persönliche Anekdote',
    'Aktuelle Nachricht',
    'Zitat',
    'Frage',
    'Szenario',
    'Auto'
  ]).default('Auto'),
  timeHorizon: z.number().min(1).max(100).default(20),
  style: z.enum([
    'Magazin/Populär',
    'Wissenschaftlich/Fachlich',
    'Blog/Persönlich',
    'News/Journalistisch',
    'Essay/Philosophisch'
  ]).default('Magazin/Populär'),
  audience: z.enum([
    'Gebildete Laien',
    'Fachexperten',
    'Einsteiger',
    'Entscheidungsträger',
    'Entwickler/Techniker'
  ]).default('Gebildete Laien'),
  structure: z.enum([
    'Klassisch (Einleitung-Hauptteil-Schluss)',
    'Pyramide (Wichtigstes zuerst)',
    'Chronologisch',
    'Problem-Lösung',
    'These-Antithese-Synthese',
    'Listicle/Aufzählung'
  ]).default('Klassisch'),
  sources: z.enum([
    'Mit Quellenhinweisen',
    'Ohne explizite Quellen',
    'Nur seriöse Quellen',
    'Inklusive Social Media'
  ]).default('Mit Quellenhinweisen'),
  factLevel: z.enum([
    'Nur verifizierte Fakten',
    'Plausible Szenarien',
    'Spekulative Visionen',
    'Science Fiction'
  ]).default('Plausible Szenarien'),
  userContext: z.string().optional(),
  autoPublish: z.boolean().default(false),
  scheduledPublish: z.string().optional(), // ISO date string
  seoOptimize: z.boolean().default(true),
  generateTags: z.boolean().default(true),
  generateImages: z.boolean().default(false)
});

const BatchWriterSchema = z.object({
  articles: z.array(WriterConfigSchema).min(1).max(10),
  staggering: z.number().min(0).max(3600).default(0), // seconds between articles
});

/**
 * POST /api/ai/writer - Generate content using FluxAO Writer system
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check AI and writer permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true, 
        id: true,
        aiPermissions: true,
        aiUsage: true
      },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json({ error: 'Writer access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    // Initialize AI systems
    const providerManager = new AIProviderManager();
    const masterPrompt = new MasterPromptSystem();
    const security = new SecurityValidator();

    // Security validation
    const securityCheck = security.validateRequest(body, user);
    if (!securityCheck.valid) {
      logger.warn({ userId: user.id, reason: securityCheck.reason }, 'Writer request blocked by security');
      return NextResponse.json({ error: securityCheck.reason }, { status: 403 });
    }

    switch (action) {
      case 'generate-article': {
        const config = WriterConfigSchema.parse(body);
        
        // Build specialized writer prompt
        const writerPrompt = masterPrompt.buildWriterPrompt(config);
        
        // Execute with selected provider
        const provider = providerManager.getProvider(config.provider);
        const result = await provider.execute({
          task: 'content-generation',
          prompt: writerPrompt,
          userId: user.id,
          metadata: { writerConfig: config }
        });

        // Parse and enhance the generated content
        const enhancedContent = await processGeneratedContent(
          result.content, 
          config, 
          providerManager, 
          masterPrompt,
          user.id
        );

        // Auto-publish if requested
        let postId: string | null = null;
        if (config.autoPublish) {
          const post = await createPost(enhancedContent, config, user.id);
          postId = post.id;
        }

        return NextResponse.json({
          success: true,
          content: enhancedContent,
          postId,
          provider: config.provider,
          usage: result.usage,
          metadata: result.metadata
        });
      }

      case 'batch-generate': {
        const batchConfig = BatchWriterSchema.parse(body);
        
        const results = [];
        for (let i = 0; i < batchConfig.articles.length; i++) {
          const config = batchConfig.articles[i];
          
          try {
            // Generate article
            const writerPrompt = masterPrompt.buildWriterPrompt(config);
            const provider = providerManager.getProvider(config.provider);
            const result = await provider.execute({
              task: 'content-generation',
              prompt: writerPrompt,
              userId: user.id,
              metadata: { writerConfig: config, batchIndex: i }
            });

            const enhancedContent = await processGeneratedContent(
              result.content,
              config,
              providerManager,
              masterPrompt,
              user.id
            );

            // Auto-publish if requested
            let postId: string | null = null;
            if (config.autoPublish) {
              const post = await createPost(enhancedContent, config, user.id);
              postId = post.id;
            }

            results.push({
              index: i,
              success: true,
              content: enhancedContent,
              postId,
              title: config.title,
              provider: config.provider
            });

            // Stagger between articles if configured
            if (i < batchConfig.articles.length - 1 && batchConfig.staggering > 0) {
              await new Promise(resolve => setTimeout(resolve, batchConfig.staggering * 1000));
            }
          } catch (error) {
            results.push({
              index: i,
              success: false,
              error: error.message,
              title: config.title
            });
          }
        }

        return NextResponse.json({
          success: true,
          results,
          summary: {
            total: batchConfig.articles.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        });
      }

      case 'optimize-content': {
        const optimizeSchema = z.object({
          content: z.string(),
          targetKeywords: z.array(z.string()).optional(),
          seoOptimize: z.boolean().default(true),
          improveTone: z.boolean().default(false),
          targetLength: z.number().optional()
        });

        const { content, targetKeywords, seoOptimize, improveTone, targetLength } = optimizeSchema.parse(body);

        let optimizedContent = content;
        const improvements = [];

        // SEO optimization
        if (seoOptimize) {
          const seoProvider = providerManager.getProvider('claude');
          const seoPrompt = masterPrompt.buildSEOPrompt({
            title: 'Content Optimization',
            content: optimizedContent,
            targetKeywords,
            language: 'de'
          });

          const seoResult = await seoProvider.execute({
            task: 'SEO-optimization',
            prompt: seoPrompt,
            userId: user.id
          });

          if (seoResult.success) {
            optimizedContent = seoResult.content;
            improvements.push('SEO optimized');
          }
        }

        // Tone improvement
        if (improveTone) {
          const toneProvider = providerManager.getProvider('claude');
          const tonePrompt = `Verbessere den Ton und die Lesbarkeit des folgenden deutschen Textes für eine gebildete Zielgruppe:

${optimizedContent}

Behalte den Inhalt bei, aber verbessere:
- Klarheit und Verständlichkeit
- Engagement und Leserinteresse  
- Professionellen aber zugänglichen Stil
- Deutsche Sprachqualität`;

          const toneResult = await toneProvider.execute({
            task: 'content-generation',
            prompt: tonePrompt,
            userId: user.id
          });

          if (toneResult.success) {
            optimizedContent = toneResult.content;
            improvements.push('Tone improved');
          }
        }

        // Length adjustment
        if (targetLength && Math.abs(optimizedContent.length - targetLength) > targetLength * 0.1) {
          const lengthProvider = providerManager.getProvider('claude');
          const action = optimizedContent.length > targetLength ? 'kürzen' : 'erweitern';
          const lengthPrompt = `${action} Sie den folgenden deutschen Text auf etwa ${targetLength} Zeichen:

${optimizedContent}

Behalten Sie alle wichtigen Informationen bei und sorgen Sie für einen natürlichen Textfluss.`;

          const lengthResult = await lengthProvider.execute({
            task: 'content-generation',
            prompt: lengthPrompt,
            userId: user.id
          });

          if (lengthResult.success) {
            optimizedContent = lengthResult.content;
            improvements.push(`Length adjusted to ${targetLength} characters`);
          }
        }

        return NextResponse.json({
          success: true,
          originalContent: content,
          optimizedContent: optimizedContent,
          improvements,
          stats: {
            originalLength: content.length,
            optimizedLength: optimizedContent.length,
            wordsOriginal: content.split(/\s+/).length,
            wordsOptimized: optimizedContent.split(/\s+/).length
          }
        });
      }

      case 'content-ideas': {
        const ideasSchema = z.object({
          category: z.string().default('KI & Tech'),
          count: z.number().min(1).max(20).default(10),
          trendFocus: z.boolean().default(true),
          timeHorizon: z.number().default(12) // months
        });

        const { category, count, trendFocus, timeHorizon } = ideasSchema.parse(body);

        const provider = providerManager.getProvider('claude');
        const ideasPrompt = `Generiere ${count} innovative Artikel-Ideen für die Kategorie "${category}".

${trendFocus ? `Fokus auf aktuelle und kommende Trends der nächsten ${timeHorizon} Monate.` : ''}

Für jede Idee liefere:
- Titel (prägnant, suchmaschinenoptimiert)
- Kurzbeschreibung (1-2 Sätze)
- Zielgruppe
- Geschätztes Suchvolumen-Potenzial
- 3-5 relevante Keywords
- Geschätzte Lesedauer

Format als JSON-Array mit diesen Feldern:
[{
  "title": "...",
  "description": "...",
  "audience": "...",
  "searchPotential": "high|medium|low",
  "keywords": ["..."],
  "estimatedReadTime": 5
}]

Fokus auf deutsche Zielgruppe und SEO-Optimierung.`;

        const result = await provider.execute({
          task: 'analysis',
          prompt: ideasPrompt,
          userId: user.id
        });

        let ideas: any[] = [];
        try {
          // Try to parse JSON response
          const jsonMatch = result.content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            ideas = JSON.parse(jsonMatch[0]);
          }
        } catch (error) {
          // Fallback to text parsing
          ideas = [{ 
            title: 'Content Ideas Generated', 
            description: result.content.slice(0, 200),
            audience: 'Gebildete Laien',
            searchPotential: 'medium',
            keywords: ['AI', 'Technology'],
            estimatedReadTime: 5
          }];
        }

        return NextResponse.json({
          success: true,
          ideas,
          metadata: {
            category,
            count: ideas.length,
            generated: new Date().toISOString()
          }
        });
      }

      case 'topic-research': {
        const researchSchema = z.object({
          topic: z.string(),
          depth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
          includeStats: z.boolean().default(true),
          includeExperts: z.boolean().default(true),
          language: z.string().default('de')
        });

        const { topic, depth, includeStats, includeExperts, language } = researchSchema.parse(body);

        const provider = providerManager.getProvider('claude');
        const researchPrompt = `Führe eine ${depth === 'comprehensive' ? 'umfassende' : depth === 'detailed' ? 'detaillierte' : 'grundlegende'} Recherche zum Thema "${topic}" durch.

Strukturiere die Recherche wie folgt:

1. ÜBERSICHT
   - Definition und Einordnung
   - Aktuelle Relevanz und Trends

2. WICHTIGE ASPEKTE
   - Schlüsselkonzepte und -technologien
   - Aktuelle Entwicklungen
   - Zukunftsprognosen

${includeStats ? `3. STATISTIKEN & ZAHLEN
   - Relevante Marktdaten
   - Nutzungsstatistiken
   - Wachstumsprognosen` : ''}

${includeExperts ? `4. EXPERTEN & QUELLEN
   - Führende Persönlichkeiten
   - Wichtige Unternehmen/Organisationen  
   - Empfohlene Quellen` : ''}

5. ARTIKEL-POTENZIAL
   - Mögliche Artikel-Winkel
   - SEO-Keywords
   - Zielgruppen-Insights

Sprache: ${language === 'de' ? 'Deutsch' : 'English'}
Fokus auf faktische, aktuelle Informationen.`;

        const result = await provider.execute({
          task: 'analysis',
          prompt: researchPrompt,
          userId: user.id
        });

        return NextResponse.json({
          success: true,
          research: result.content,
          topic,
          metadata: {
            depth,
            includeStats,
            includeExperts,
            generated: new Date().toISOString(),
            wordCount: result.content.split(/\s+/).length
          }
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI Writer task failed');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/writer - Get writer system status and capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json({ error: 'Writer access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status': {
        const providerManager = new AIProviderManager();
        const providersStatus = await providerManager.getProvidersStatus();
        
        return NextResponse.json({
          writerSystem: {
            status: 'active',
            version: '2.0.0',
            features: [
              'Multi-Provider Generation',
              'Expert Personas',
              'SEO Optimization', 
              'Batch Processing',
              'Auto-Publishing',
              'Content Optimization'
            ]
          },
          providers: providersStatus,
          categories: [
            'KI & Tech',
            'Mensch & Gesellschaft', 
            'Style & Ästhetik',
            'Gaming & Kultur',
            'Mindset & Philosophie',
            'Wirtschaft & Innovation'
          ],
          thinkers: Object.keys(masterPromptSystem.thinkerPersonas || {}),
          lastUpdate: new Date().toISOString()
        });
      }

      case 'templates': {
        return NextResponse.json({
          templates: [
            {
              id: 'tech-analysis',
              name: 'Tech Trend Analysis',
              category: 'KI & Tech',
              thinker: 'Kurzweil',
              tone: 'analytisch-kühl',
              length: 1500
            },
            {
              id: 'society-impact',
              name: 'Gesellschaftliche Auswirkungen',
              category: 'Mensch & Gesellschaft',
              thinker: 'Harari',
              tone: 'kritisch-hinterfragend', 
              length: 2000
            },
            {
              id: 'future-vision',
              name: 'Zukunftsvision',
              category: 'Mindset & Philosophie',
              thinker: 'Mix',
              tone: 'optimistisch-visionär',
              length: 1200
            }
          ]
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI Writer API error');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
async function processGeneratedContent(
  content: string,
  config: any,
  providerManager: AIProviderManager,
  masterPrompt: MasterPromptSystem,
  userId: string
): Promise<any> {
  const processed: any = {
    rawContent: content,
    title: config.title,
    content: content,
    category: config.category,
    metadata: {
      generated: new Date().toISOString(),
      provider: config.provider,
      config: config
    }
  };

  // Extract title if it's in the content
  const titleMatch = content.match(/^#\s*(.+)$/m);
  if (titleMatch) {
    processed.title = titleMatch[1].trim();
  }

  // Generate SEO-optimized tags if requested
  if (config.generateTags) {
    try {
      const tagProvider = providerManager.getProvider('claude');
      const tagPrompt = `Analysiere den folgenden deutschen Artikel und generiere:
1. 5-8 relevante Tags/Keywords
2. 1-2 passende Kategorien aus: ${JSON.stringify(['technologie', 'gesellschaft', 'lifestyle', 'gaming', 'philosophie', 'wirtschaft'])}

Artikel: ${content.slice(0, 1000)}...

Antwort als JSON:
{
  "tags": ["tag1", "tag2", ...],
  "categories": ["kategorie1"]
}`;

      const tagResult = await tagProvider.execute({
        task: 'analysis',
        prompt: tagPrompt,
        userId
      });

      try {
        const tagData = JSON.parse(tagResult.content);
        processed.suggestedTags = tagData.tags || [];
        processed.suggestedCategories = tagData.categories || [];
      } catch (error) {
        // Fallback tag generation
        processed.suggestedTags = [config.category.toLowerCase(), 'ai', 'technologie', 'zukunft'];
      }
    } catch (error) {
      logger.error({ error }, 'Tag generation failed');
    }
  }

  return processed;
}

async function createPost(content: any, config: any, userId: string): Promise<any> {
  try {
    const post = await prisma.post.create({
      data: {
        title: content.title,
        content: content.content,
        excerpt: content.content.slice(0, 160) + '...',
        status: 'DRAFT',
        authorId: userId,
        slug: generateSlug(content.title),
        estimatedReadTime: Math.max(1, Math.ceil(content.content.split(' ').length / 200)),
        metadata: {
          generatedBy: 'FluxAO Writer',
          writerConfig: config,
          aiProvider: config.provider,
          generatedAt: new Date().toISOString()
        }
      }
    });

    // Add tags if generated
    if (content.suggestedTags && content.suggestedTags.length > 0) {
      for (const tagName of content.suggestedTags) {
        try {
          // Find or create tag
          let tag = await prisma.tag.findUnique({
            where: { name: tagName }
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: { 
                name: tagName,
                slug: generateSlug(tagName)
              }
            });
          }

          // Link tag to post
          await prisma.postTag.create({
            data: {
              postId: post.id,
              tagId: tag.id
            }
          });
        } catch (error) {
          logger.warn({ tagName, error }, 'Failed to add tag to post');
        }
      }
    }

    return post;
  } catch (error) {
    logger.error({ error }, 'Failed to create post');
    throw error;
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, (match) => {
      const map: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
      return map[match] || match;
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    + '-' + Date.now().toString().slice(-6);
}

// Export a dummy masterPromptSystem for the status endpoint
const masterPromptSystem = new MasterPromptSystem();