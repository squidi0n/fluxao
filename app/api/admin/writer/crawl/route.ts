import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createProblemResponse, ForbiddenError, InternalServerError } from '@/lib/errors';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

interface TrendTopic {
  title: string;
  teaser?: string;
  url: string;
  source: string;
  category: string;
  score: number;
  discoveredAt: Date;
  uniqueHash: string;
}

// Category mapping based on keywords
function mapCategory(title: string): string {
  const t = title.toLowerCase();
  
  if (t.includes('ai') || t.includes('artificial intelligence') || t.includes('openai') || 
      t.includes('neural') || t.includes('gpt') || t.includes('claude') || t.includes('llm') ||
      t.includes('machine learning') || t.includes('deep learning') || t.includes('quantum')) {
    return 'KI & Tech';
  }
  
  if (t.includes('society') || t.includes('social') || t.includes('community') || 
      t.includes('culture') || t.includes('human') || t.includes('people')) {
    return 'Mensch & Gesellschaft';
  }
  
  if (t.includes('design') || t.includes('style') || t.includes('art') || t.includes('fashion') ||
      t.includes('aesthetic') || t.includes('creative') || t.includes('beauty')) {
    return 'Style & Ästhetik';
  }
  
  if (t.includes('game') || t.includes('gaming') || t.includes('play') || t.includes('entertainment') ||
      t.includes('metaverse') || t.includes('vr') || t.includes('ar') || t.includes('virtual')) {
    return 'Gaming & Kultur';
  }
  
  if (t.includes('philosophy') || t.includes('mindset') || t.includes('thinking') || 
      t.includes('consciousness') || t.includes('mind') || t.includes('wisdom')) {
    return 'Mindset & Philosophie';
  }
  
  if (t.includes('business') || t.includes('startup') || t.includes('economy') || 
      t.includes('innovation') || t.includes('invest') || t.includes('market') || t.includes('finance')) {
    return 'Wirtschaft & Innovation';
  }
  
  // Default fallback
  return 'KI & Tech';
}

async function crawlHackerNews(): Promise<{ topics: TrendTopic[], count: number }> {
  try {
    const response = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page', {
      headers: { 'User-Agent': 'FluxAO TrendBot' }
    });
    
    if (!response.ok) {
      throw new Error(`HN API returned ${response.status}`);
    }
    
    const data = await response.json();
    const topics: TrendTopic[] = [];
    
    for (const hit of data.hits || []) {
      const title = hit.title?.trim();
      if (!title) continue;
      
      const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const score = parseInt(hit.points) || 0;
      const category = mapCategory(title);
      const uniqueHash = Buffer.from(`${title.toLowerCase()}|hackernews`).toString('base64');
      
      topics.push({
        title,
        teaser: '',
        url,
        source: 'hackernews',
        category,
        score,
        discoveredAt: new Date(),
        uniqueHash
      });
    }
    
    return { topics, count: topics.length };
  } catch (error) {
    console.error('HackerNews crawl error:', error);
    return { topics: [], count: 0 };
  }
}

async function crawlReddit(subreddit: string): Promise<{ topics: TrendTopic[], count: number }> {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/.json?limit=25`, {
      headers: { 'User-Agent': 'FluxAO TrendBot' }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`);
    }
    
    const data = await response.json();
    const topics: TrendTopic[] = [];
    
    for (const post of data.data?.children || []) {
      const postData = post.data;
      const title = postData.title?.trim();
      if (!title) continue;
      
      const url = `https://www.reddit.com${postData.permalink}`;
      const score = parseInt(postData.score) || 0;
      const category = mapCategory(title);
      const uniqueHash = Buffer.from(`${title.toLowerCase()}|reddit:${subreddit}`).toString('base64');
      
      topics.push({
        title,
        teaser: postData.selftext ? postData.selftext.substring(0, 300) : '',
        url,
        source: `reddit:${subreddit}`,
        category,
        score,
        discoveredAt: new Date(),
        uniqueHash
      });
    }
    
    return { topics, count: topics.length };
  } catch (error) {
    console.error(`Reddit r/${subreddit} crawl error:`, error);
    return { topics: [], count: 0 };
  }
}

async function saveTrendTopic(topic: TrendTopic): Promise<boolean> {
  try {
    // Check if topic already exists
    const existing = await prisma.trendTopic.findUnique({
      where: { uniqueHash: topic.uniqueHash }
    });
    
    if (existing) {
      // Update score if higher
      if (topic.score > existing.score) {
        await prisma.trendTopic.update({
          where: { id: existing.id },
          data: { 
            score: topic.score,
            updatedAt: new Date()
          }
        });
      }
      return false; // Not a new topic
    }
    
    // Create new topic
    await prisma.trendTopic.create({
      data: {
        title: topic.title,
        teaser: topic.teaser || '',
        url: topic.url,
        source: topic.source,
        category: topic.category,
        score: topic.score,
        discoveredAt: topic.discoveredAt,
        uniqueHash: topic.uniqueHash
      }
    });
    
    return true; // New topic created
  } catch (error) {
    console.error('Error saving trend topic:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth();
    if (!session?.user?.id || !can(session.user, 'create', 'posts')) {
      return createProblemResponse(new ForbiddenError('Insufficient permissions for trend crawling'));
    }

    console.log('Starting trend radar crawl...');
    const sources: string[] = [];
    let totalNew = 0;

    // Crawl HackerNews
    const hnResult = await crawlHackerNews();
    let hnNew = 0;
    for (const topic of hnResult.topics) {
      const isNew = await saveTrendTopic(topic);
      if (isNew) hnNew++;
    }
    sources.push(`hn:${hnResult.count} (${hnNew} new)`);
    totalNew += hnNew;

    // Crawl Reddit subreddits
    const subreddits = ['technology', 'Futurology'];
    for (const sub of subreddits) {
      const redditResult = await crawlReddit(sub);
      let redditNew = 0;
      for (const topic of redditResult.topics) {
        const isNew = await saveTrendTopic(topic);
        if (isNew) redditNew++;
      }
      sources.push(`r/${sub}:${redditResult.count} (${redditNew} new)`);
      totalNew += redditNew;
    }

    // Log the crawl activity
    await prisma.aITaskLog.create({
      data: {
        userId: session.user.id,
        provider: 'trend-crawler',
        model: 'radar-v1',
        task: 'trend-crawl',
        success: true,
        tokensUsed: 0,
        responseTime: 0,
        metadata: {
          sources: sources,
          totalNew,
          crawledAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Trend radar updated successfully!`,
      sources,
      totalNew,
      totalSources: sources.length
    });

  } catch (error) {
    console.error('Writer Crawl API Error:', error);
    return createProblemResponse(new InternalServerError('Failed to crawl trends'));
  }
}

// GET endpoint to check crawl status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !can(session.user, 'read', 'posts')) {
      return createProblemResponse(new ForbiddenError('Insufficient permissions'));
    }

    // Get last crawl info
    const lastCrawl = await prisma.aITaskLog.findFirst({
      where: { 
        task: 'trend-crawl',
        provider: 'trend-crawler'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get topic counts by category
    const categoryStats = await prisma.trendTopic.groupBy({
      by: ['category'],
      _count: { id: true },
      where: {
        discoveredAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    const stats = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      lastCrawl: lastCrawl ? {
        timestamp: lastCrawl.createdAt,
        sources: lastCrawl.metadata?.sources || [],
        totalNew: lastCrawl.metadata?.totalNew || 0
      } : null,
      categoryStats: stats
    });

  } catch (error) {
    console.error('Writer Crawl Status Error:', error);
    return createProblemResponse(new InternalServerError('Failed to get crawl status'));
  }
}