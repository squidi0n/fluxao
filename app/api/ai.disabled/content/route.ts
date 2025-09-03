import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addAIJob, getJobStatus } from '@/server/queue/ai-jobs';
import {
  generateBlogPost,
  generateContentIdeas,
  optimizeForSEO,
  generateSocialContent,
  generateContentVariations,
} from '@/lib/ai/content-generation';

// Request schemas
const GeneratePostSchema = z.object({
  title: z.string().min(10).max(200),
  options: z.object({
    category: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    targetAudience: z.string().optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    style: z.enum(['tutorial', 'news', 'opinion', 'interview', 'review']).optional(),
    includeCode: z.boolean().optional(),
    language: z.enum(['de', 'en']).optional(),
  }).optional(),
  async: z.boolean().optional(),
});

const GenerateIdeasSchema = z.object({
  count: z.number().min(1).max(20).default(5),
  category: z.string().optional(),
  async: z.boolean().optional(),
});

const OptimizeSEOSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(100),
  async: z.boolean().optional(),
});

const GenerateSocialSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(100),
  platforms: z.array(z.string()).default(['twitter', 'linkedin', 'facebook']),
  async: z.boolean().optional(),
});

const GenerateVariationsSchema = z.object({
  originalTitle: z.string().min(10),
  originalContent: z.string().min(100),
  variationCount: z.number().min(1).max(5).default(3),
  async: z.boolean().optional(),
});

/**
 * POST /api/ai/content - Generate various types of content
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (!user || !['ADMIN', 'EDITOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const body = await request.json();

    switch (action) {
      case 'generate-post': {
        const { title, options, async } = GeneratePostSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('content-generation', {
            subtype: 'blog-post',
            title,
            options,
          }, {
            userId: user.id,
            priority: 5,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateBlogPost(title, options || {});
        return NextResponse.json(result);
      }

      case 'generate-ideas': {
        const { count, category, async } = GenerateIdeasSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('content-generation', {
            subtype: 'ideas',
            count,
            category,
          }, {
            userId: user.id,
            priority: 3,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateContentIdeas(count, category);
        return NextResponse.json(result);
      }

      case 'optimize-seo': {
        const { title, content, async } = OptimizeSEOSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('seo-optimization', {
            title,
            content,
          }, {
            userId: user.id,
            priority: 4,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await optimizeForSEO(title, content);
        return NextResponse.json(result);
      }

      case 'generate-social': {
        const { title, content, platforms, async } = GenerateSocialSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('content-generation', {
            subtype: 'social',
            title,
            content,
            platforms,
          }, {
            userId: user.id,
            priority: 2,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateSocialContent(title, content, platforms);
        return NextResponse.json(result);
      }

      case 'generate-variations': {
        const { originalTitle, originalContent, variationCount, async } = GenerateVariationsSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('content-generation', {
            subtype: 'variations',
            originalTitle,
            originalContent,
            variationCount,
          }, {
            userId: user.id,
            priority: 3,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateContentVariations(originalTitle, originalContent, variationCount);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI content generation failed');
    
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
 * GET /api/ai/content - Get job status or content suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const action = url.searchParams.get('action');

    if (jobId) {
      const status = await getJobStatus(jobId);
      return NextResponse.json(status);
    }

    if (action === 'trending-topics') {
      // Get trending topics from recent posts
      const recentPosts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          categories: { select: { category: { select: { name: true } } } },
          tags: { select: { tag: { select: { name: true } } } },
          postAnalytics: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      });

      const trendingTopics = recentPosts
        .map(post => ({
          title: post.title,
          category: post.categories[0]?.category.name || 'General',
          tags: post.tags.map(t => t.tag.name),
          views: post.postAnalytics?.views || 0,
          engagement: post.postAnalytics?.engagementScore || 0,
        }))
        .sort((a, b) => (b.views + b.engagement) - (a.views + a.engagement))
        .slice(0, 10);

      return NextResponse.json({ topics: trendingTopics });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  } catch (error) {
    logger.error({ error }, 'AI content API error');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}