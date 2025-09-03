import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createProblemResponse, ForbiddenError, InternalServerError } from '@/lib/errors';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth();
    if (!session?.user?.id || !can(session.user, 'read', 'posts')) {
      return createProblemResponse(new ForbiddenError('Insufficient permissions for Writer access'));
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'KI & Tech';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch topics from database, ordered by score and discovery date
    const topics = await prisma.trendTopic.findMany({
      where: {
        category: category,
        // Only show topics from last 7 days for relevance
        discoveredAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: [
        { score: 'desc' },
        { discoveredAt: 'desc' }
      ],
      take: limit
    });

    // If no topics found for this category, try to get some from all categories
    if (topics.length === 0) {
      const fallbackTopics = await prisma.trendTopic.findMany({
        where: {
          discoveredAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: [
          { score: 'desc' },
          { discoveredAt: 'desc' }
        ],
        take: Math.min(limit, 10)
      });
      
      return NextResponse.json({
        success: true,
        items: fallbackTopics,
        category,
        total: fallbackTopics.length,
        message: `No recent topics found for ${category}. Showing trending topics from all categories.`
      });
    }

    // Get total count for this category
    const totalCount = await prisma.trendTopic.count({
      where: {
        category: category,
        discoveredAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return NextResponse.json({
      success: true,
      items: topics,
      category,
      total: totalCount,
      lastUpdate: topics.length > 0 ? topics[0].discoveredAt : null
    });
  } catch (error) {
    console.error('Writer Topics API Error:', error);
    return createProblemResponse(new InternalServerError('Failed to fetch topics'));
  }
}

// POST endpoint to add custom topics
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !can(session.user, 'create', 'posts')) {
      return createProblemResponse(new ForbiddenError('Insufficient permissions to add topics'));
    }

    const body = await request.json();
    const { title, category = 'KI & Tech', source = 'Manual', teaser = '', url = '' } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create unique hash for deduplication
    const uniqueHash = Buffer.from(`${title.toLowerCase()}|${source.toLowerCase()}`).toString('base64');

    // Save to database
    const newTopic = await prisma.trendTopic.create({
      data: {
        title,
        teaser,
        url: url || `#custom-topic-${Date.now()}`,
        source,
        category,
        score: 1, // Manual topics get base score
        uniqueHash,
        discoveredAt: new Date(),
      }
    });

    // Log the custom topic creation
    await prisma.aITaskLog.create({
      data: {
        userId: session.user.id,
        provider: 'manual',
        model: 'custom-topic',
        task: 'topic-creation',
        success: true,
        tokensUsed: 0,
        responseTime: 0,
        metadata: {
          topicId: newTopic.id,
          category: newTopic.category,
          source: newTopic.source
        }
      }
    });

    return NextResponse.json({
      success: true,
      topic: newTopic,
      message: 'Custom topic added successfully'
    });
  } catch (error) {
    console.error('Writer Topics POST Error:', error);
    return createProblemResponse(new InternalServerError('Failed to add topic'));
  }
}