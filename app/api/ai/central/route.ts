import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { AIProviderManager } from '@/lib/ai/provider-manager';
import { MasterPromptSystem } from '@/lib/ai/master-prompt';
import { MonitoringSystem } from '@/lib/ai/monitoring';
import { SecurityValidator } from '@/lib/ai/security';

// Request schemas
const AIProviderSchema = z.enum(['claude', 'openai', 'gemini', 'llama', 'cohere']);

const AITaskSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional(),
  task: z.enum([
    'content-generation',
    'analysis',
    'moderation',
    'summarization',
    'translation',
    'SEO-optimization',
    'trend-analysis',
    'monitoring'
  ]),
  prompt: z.string(),
  context: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  priority: z.number().min(1).max(10).default(5),
  async: z.boolean().default(false),
});

const MultiProviderTaskSchema = z.object({
  providers: z.array(AIProviderSchema).min(1).max(5),
  task: z.string(),
  prompt: z.string(),
  context: z.string().optional(),
  compareResults: z.boolean().default(false),
  async: z.boolean().default(false),
});

/**
 * POST /api/ai/central - Main AI Central System endpoint
 * Handles all AI tasks across multiple providers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check AI permissions
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
      return NextResponse.json({ error: 'AI access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    // Initialize AI systems
    const providerManager = new AIProviderManager();
    const masterPrompt = new MasterPromptSystem();
    const monitoring = new MonitoringSystem();
    const security = new SecurityValidator();

    // Security validation
    const securityCheck = security.validateRequest(body, user);
    if (!securityCheck.valid) {
      logger.warn({ userId: user.id, reason: securityCheck.reason }, 'AI request blocked by security');
      return NextResponse.json({ error: securityCheck.reason }, { status: 403 });
    }

    switch (action) {
      case 'single-task': {
        const taskData = AITaskSchema.parse(body);
        
        // Apply master prompt rules
        const enhancedPrompt = masterPrompt.enhance(taskData.prompt, {
          task: taskData.task,
          user: user,
          context: taskData.context
        });

        // Execute task
        const provider = providerManager.getProvider(taskData.provider);
        const result = await provider.execute({
          ...taskData,
          prompt: enhancedPrompt,
          userId: user.id
        });

        // Monitor and log
        await monitoring.logTask({
          userId: user.id,
          provider: taskData.provider,
          task: taskData.task,
          success: true,
          tokensUsed: result.usage?.totalTokens || 0,
          responseTime: result.responseTime || 0
        });

        return NextResponse.json({
          success: true,
          provider: taskData.provider,
          result: result.content,
          usage: result.usage,
          metadata: result.metadata
        });
      }

      case 'multi-provider': {
        const taskData = MultiProviderTaskSchema.parse(body);
        
        // Apply master prompt rules
        const enhancedPrompt = masterPrompt.enhance(taskData.prompt, {
          task: 'multi-provider',
          user: user,
          context: taskData.context
        });

        // Execute across multiple providers
        const results = await providerManager.executeMultiple({
          providers: taskData.providers,
          prompt: enhancedPrompt,
          context: taskData.context,
          userId: user.id,
          compareResults: taskData.compareResults
        });

        // Monitor results
        for (const result of results) {
          await monitoring.logTask({
            userId: user.id,
            provider: result.provider,
            task: 'multi-provider',
            success: result.success,
            tokensUsed: result.usage?.totalTokens || 0,
            responseTime: result.responseTime || 0
          });
        }

        return NextResponse.json({
          success: true,
          results: results,
          comparison: taskData.compareResults ? await providerManager.compareResults(results) : null
        });
      }

      case 'writer-integration': {
        const writerData = z.object({
          category: z.string(),
          title: z.string(),
          length: z.number().default(1200),
          tone: z.string().default('analytisch-kühl'),
          thinker: z.string().default('Auto'),
          hook: z.string().default('Auto'),
          timeHorizon: z.number().default(20),
          style: z.string().default('Magazin/Populär'),
          audience: z.string().default('Gebildete Laien'),
          structure: z.string().default('Klassisch'),
          sources: z.string().default('Mit Quellenhinweisen'),
          factLevel: z.string().default('Plausible Szenarien'),
          userContext: z.string().optional(),
          provider: AIProviderSchema.default('claude'),
          autoPublish: z.boolean().default(false)
        }).parse(body);

        // Generate article with FluxAO Writer integration
        const writerPrompt = masterPrompt.buildWriterPrompt(writerData);
        const provider = providerManager.getProvider(writerData.provider);
        
        const result = await provider.execute({
          task: 'content-generation',
          prompt: writerPrompt,
          userId: user.id,
          metadata: writerData
        });

        // Auto-import to FluxAO if requested
        if (writerData.autoPublish) {
          const articleData = {
            title: writerData.title,
            content: result.content,
            category: writerData.category,
            tags: result.metadata?.suggestedTags || [],
            status: 'DRAFT',
            authorId: user.id,
            metadata: {
              generatedBy: 'FluxAO AI Central',
              provider: writerData.provider,
              generatedAt: new Date().toISOString(),
              writerConfig: writerData
            }
          };

          const post = await prisma.post.create({
            data: articleData
          });

          return NextResponse.json({
            success: true,
            result: result.content,
            postId: post.id,
            message: 'Article generated and saved as draft'
          });
        }

        return NextResponse.json({
          success: true,
          result: result.content,
          metadata: result.metadata
        });
      }

      case 'monitoring-check': {
        // AI-powered system monitoring
        const metrics = await monitoring.getCurrentMetrics();
        const alerts = await monitoring.checkAlerts(metrics);
        
        if (alerts.length > 0) {
          // Use AI to analyze alerts and provide insights
          const provider = providerManager.getProvider('claude');
          const analysis = await provider.execute({
            task: 'analysis',
            prompt: masterPrompt.buildMonitoringPrompt(metrics, alerts),
            userId: user.id
          });

          return NextResponse.json({
            success: true,
            metrics: metrics,
            alerts: alerts,
            aiAnalysis: analysis.content,
            recommendations: analysis.metadata?.recommendations || []
          });
        }

        return NextResponse.json({
          success: true,
          metrics: metrics,
          status: 'All systems operational'
        });
      }

      case 'auto-moderation': {
        const moderationData = z.object({
          content: z.string(),
          contentType: z.enum(['comment', 'post', 'user-input']),
          strictness: z.enum(['low', 'medium', 'high']).default('medium')
        }).parse(body);

        // Multi-provider moderation for accuracy
        const moderationProviders = ['claude', 'openai'] as const;
        const results = await providerManager.executeMultiple({
          providers: moderationProviders,
          prompt: masterPrompt.buildModerationPrompt(moderationData.content, moderationData.contentType, moderationData.strictness),
          userId: user.id
        });

        // Combine moderation results
        const moderationResult = await providerManager.combineModerationResults(results);

        return NextResponse.json({
          success: true,
          approved: moderationResult.approved,
          confidence: moderationResult.confidence,
          reasons: moderationResult.reasons,
          suggestedAction: moderationResult.suggestedAction,
          results: results
        });
      }

      case 'seo-optimization': {
        const seoData = z.object({
          title: z.string(),
          content: z.string(),
          targetKeywords: z.array(z.string()).optional(),
          language: z.string().default('de')
        }).parse(body);

        const provider = providerManager.getProvider('claude');
        const result = await provider.execute({
          task: 'SEO-optimization',
          prompt: masterPrompt.buildSEOPrompt(seoData),
          userId: user.id
        });

        return NextResponse.json({
          success: true,
          optimizedTitle: result.metadata?.optimizedTitle,
          optimizedContent: result.content,
          seoScore: result.metadata?.seoScore,
          recommendations: result.metadata?.recommendations,
          suggestedTags: result.metadata?.suggestedTags
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI Central task failed');
    
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
 * GET /api/ai/central - Get AI Central status and capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, aiUsage: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json({ error: 'AI access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    const providerManager = new AIProviderManager();
    const monitoring = new MonitoringSystem();

    switch (action) {
      case 'status': {
        const providersStatus = await providerManager.getProvidersStatus();
        const systemMetrics = await monitoring.getCurrentMetrics();
        
        return NextResponse.json({
          providers: providersStatus,
          system: systemMetrics,
          features: {
            multiProvider: true,
            writerIntegration: true,
            autoModeration: true,
            seoOptimization: true,
            monitoring: true,
            backgroundJobs: true
          },
          lastUpdate: new Date().toISOString()
        });
      }

      case 'providers': {
        const providers = await providerManager.getProviderCapabilities();
        return NextResponse.json(providers);
      }

      case 'usage-stats': {
        const stats = await monitoring.getUsageStats(user.id);
        return NextResponse.json(stats);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI Central API error');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}