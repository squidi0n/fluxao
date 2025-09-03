import { prisma } from './prisma';
import { generateNewsletterHTML } from './newsletter-templates';

export interface NewsletterAutofillData {
  recentPosts: any[];
  weeklyStats: {
    totalArticles: number;
    totalSubscribers: number;
    weeklyTip: string;
  };
  featuredQuote?: string;
  customSections?: Array<{
    title: string;
    content: string;
    type: 'text' | 'html' | 'posts';
  }>;
}

/**
 * Fetch recent posts for newsletter auto-fill
 */
export async function getRecentPostsForNewsletter(
  daysBack: number = 7,
  limit: number = 5
): Promise<any[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const posts = await prisma.post.findMany({
    where: {
      publishedAt: {
        gte: cutoffDate,
      },
      published: true,
    },
    orderBy: [
      { fluxScore: 'desc' },
      { publishedAt: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      thumbnail: true,
      publishedAt: true,
      readTime: true,
      category: true,
      author: {
        select: {
          name: true,
          username: true,
        },
      },
      fluxScore: true,
      _count: {
        select: {
          articleVotes: true,
          comments: true,
        },
      },
    },
  });

  // Transform posts for newsletter format
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fluxao.com'}/${post.slug}`,
    excerpt: post.excerpt || `${post.title.slice(0, 120)}...`,
    thumbnail: post.thumbnail,
    category: post.category || 'Tech',
    readTime: post.readTime || 5,
    author: post.author?.name || 'FluxAO Team',
    publishedAt: post.publishedAt,
    engagement: post._count.articleVotes + post._count.comments,
    fluxScore: post.fluxScore || 0,
  }));
}

/**
 * Get newsletter statistics for auto-fill
 */
export async function getNewsletterStats(): Promise<NewsletterAutofillData['weeklyStats']> {
  const [totalArticles, totalSubscribers, randomQuote] = await Promise.all([
    prisma.post.count({ where: { published: true } }),
    prisma.newsletterSubscriber.count({ where: { status: 'verified' } }),
    getRandomWeeklyTip(),
  ]);

  return {
    totalArticles,
    totalSubscribers,
    weeklyTip: randomQuote || 'Innovation ist der Schlüssel zum Erfolg in der digitalen Welt.',
  };
}

/**
 * Get random weekly tip from quotes
 */
async function getRandomWeeklyTip(): Promise<string> {
  try {
    const quotes = await prisma.quote.findMany({
      where: {
        language: 'de',
      },
      take: 1,
      skip: Math.floor(Math.random() * 10), // Random offset for variety
    });

    if (quotes.length > 0) {
      return quotes[0].text;
    }
  } catch (error) {
    console.warn('Failed to fetch random quote:', error);
  }

  // Fallback tips
  const fallbackTips = [
    'Die beste Zeit, einen Baum zu pflanzen, war vor 20 Jahren. Die zweitbeste Zeit ist jetzt.',
    'Innovation entsteht dort, wo verschiedene Disziplinen aufeinandertreffen.',
    'Der Erfolg von morgen beginnt mit dem Lernen von heute.',
    'Technologie ist nur so gut wie die Menschen, die sie verwenden.',
    'In einer sich schnell verändernden Welt ist Anpassungsfähigkeit der größte Vorteil.',
    'Daten sind das neue Öl, aber nur wenn man sie zu raffinieren weiß.',
    'KI wird nicht die Jobs ersetzen, sondern die Art, wie wir arbeiten, revolutionieren.',
  ];

  return fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
}

/**
 * Generate trending topics from recent posts
 */
export async function getTrendingTopics(limit: number = 3): Promise<Array<{
  topic: string;
  count: number;
  posts: string[];
}>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14); // Last 2 weeks

    // Get recent posts with categories and tags
    const posts = await prisma.post.findMany({
      where: {
        publishedAt: { gte: cutoffDate },
        published: true,
      },
      select: {
        title: true,
        category: true,
        tags: true,
        fluxScore: true,
      },
    });

    // Count categories and high-performing tags
    const topicCounts = new Map<string, { count: number; posts: string[] }>();

    posts.forEach((post) => {
      // Add category
      if (post.category) {
        const existing = topicCounts.get(post.category) || { count: 0, posts: [] };
        topicCounts.set(post.category, {
          count: existing.count + 1,
          posts: [...existing.posts, post.title].slice(0, 3),
        });
      }

      // Add high-value tags
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          if (typeof tag === 'string' && post.fluxScore && post.fluxScore > 50) {
            const existing = topicCounts.get(tag) || { count: 0, posts: [] };
            topicCounts.set(tag, {
              count: existing.count + 1,
              posts: [...existing.posts, post.title].slice(0, 3),
            });
          }
        });
      }
    });

    // Sort by count and return top topics
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        posts: data.posts,
      }));
  } catch (error) {
    console.warn('Failed to get trending topics:', error);
    return [];
  }
}

/**
 * Complete auto-fill data for newsletter
 */
export async function getNewsletterAutofillData(
  options: {
    daysBack?: number;
    postLimit?: number;
    includeTrending?: boolean;
    includeStats?: boolean;
  } = {}
): Promise<NewsletterAutofillData> {
  const {
    daysBack = 7,
    postLimit = 5,
    includeTrending = true,
    includeStats = true,
  } = options;

  const [recentPosts, weeklyStats, trendingTopics] = await Promise.all([
    getRecentPostsForNewsletter(daysBack, postLimit),
    includeStats ? getNewsletterStats() : Promise.resolve({
      totalArticles: 0,
      totalSubscribers: 0,
      weeklyTip: '',
    }),
    includeTrending ? getTrendingTopics() : Promise.resolve([]),
  ]);

  // Generate custom sections based on data
  const customSections = [];

  // Add trending topics section if we have data
  if (trendingTopics.length > 0) {
    const trendingHtml = `
      <div style="margin: 0 0 40px 0; padding: 25px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border-left: 4px solid #10b981;">
        <h3 style="color: #047857; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
          🔥 Trending Themen diese Woche
        </h3>
        <div style="display: grid; gap: 15px;">
          ${trendingTopics.map(topic => `
            <div style="background: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 8px;">
              <div style="font-weight: 600; color: #047857; margin-bottom: 5px;">
                #${topic.topic} <span style="font-size: 12px; color: #6b7280;">(${topic.count} Artikel)</span>
              </div>
              <div style="font-size: 12px; color: #4b5563;">
                ${topic.posts.slice(0, 2).join(' • ')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    customSections.push({
      title: 'Trending Themen',
      content: trendingHtml,
      type: 'html' as const,
    });
  }

  // Add community highlights if we have engagement data
  if (recentPosts.some(post => post.engagement > 0)) {
    const topEngagementPost = recentPosts.reduce((prev, current) => 
      (current.engagement > prev.engagement) ? current : prev
    );

    const highlightHtml = `
      <div style="margin: 0 0 40px 0; padding: 25px; background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%); border-radius: 12px; border-left: 4px solid #8b5cf6;">
        <h3 style="color: #6b21a8; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
          🏆 Community Highlight
        </h3>
        <p style="color: #7c3aed; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
          Unser meistdiskutierter Artikel diese Woche:
        </p>
        <div style="background: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h4 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
            <a href="${topEngagementPost.url}" style="color: #1f2937; text-decoration: none;">${topEngagementPost.title}</a>
          </h4>
          <div style="color: #6b7280; font-size: 14px;">
            ${topEngagementPost.engagement} Interaktionen • ${topEngagementPost.author}
          </div>
        </div>
      </div>
    `;

    customSections.push({
      title: 'Community Highlight',
      content: highlightHtml,
      type: 'html' as const,
    });
  }

  return {
    recentPosts,
    weeklyStats,
    customSections,
  };
}

/**
 * Generate complete newsletter with auto-filled content
 */
export async function generateAutofillNewsletter(
  templateType: 'weekly' | 'welcome' | 'announcement' | 'promotional' = 'weekly',
  customData: {
    title?: string;
    introText?: string;
    additionalContent?: string;
  } = {}
): Promise<{
  html: string;
  data: NewsletterAutofillData;
  metadata: {
    subject: string;
    preheader: string;
    estimatedReadTime: number;
  };
}> {
  // Get auto-fill data
  const autofillData = await getNewsletterAutofillData();
  
  // Generate custom content from auto-fill data
  let customContent = '';
  
  // Add trending topics
  autofillData.customSections?.forEach(section => {
    customContent += section.content;
  });

  // Add any additional custom content
  if (customData.additionalContent) {
    customContent += `
      <div style="margin: 0 0 40px 0;">
        ${customData.additionalContent}
      </div>
    `;
  }

  // Prepare template data
  const templateData = {
    title: customData.title || `FluxAO Weekly - ${new Date().toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`,
    content: customData.introText || `Hallo zusammen! Diese Woche haben wir ${autofillData.recentPosts.length} spannende neue Artikel für euch. Hier sind die Highlights:`,
    posts: autofillData.recentPosts,
    customContent,
    preheader: `${autofillData.recentPosts.length} neue Artikel | ${autofillData.weeklyStats.totalSubscribers} Abonnenten | Deine wöchentliche Tech-Dosis`,
  };

  // Generate variables for template
  const variables = {
    WEEKLY_TIP: autofillData.weeklyStats.weeklyTip,
    TOTAL_ARTICLES: autofillData.weeklyStats.totalArticles.toString(),
    NEWSLETTER_SUBSCRIBERS: autofillData.weeklyStats.totalSubscribers.toString(),
    UNSUBSCRIBE_URL: '{{UNSUBSCRIBE_URL}}', // Will be replaced during sending
    TRACKING_PIXEL_URL: '{{TRACKING_PIXEL_URL}}', // Will be replaced during sending
  };

  // Generate HTML
  const html = generateNewsletterHTML(templateType, templateData, variables);

  // Calculate estimated read time
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

  // Generate subject line
  let subject = templateData.title;
  if (autofillData.recentPosts.length > 0) {
    const topPost = autofillData.recentPosts[0];
    subject = `FluxAO: ${topPost.title.slice(0, 30)}... und ${autofillData.recentPosts.length - 1} weitere Artikel`;
  }

  return {
    html,
    data: autofillData,
    metadata: {
      subject,
      preheader: templateData.preheader,
      estimatedReadTime,
    },
  };
}

/**
 * Preview newsletter with auto-filled content
 */
export async function previewAutofillNewsletter(
  templateType: 'weekly' | 'welcome' | 'announcement' | 'promotional' = 'weekly',
  customData: {
    title?: string;
    introText?: string;
    additionalContent?: string;
  } = {}
): Promise<{
  html: string;
  metadata: {
    subject: string;
    preheader: string;
    postCount: number;
    estimatedReadTime: number;
  };
}> {
  const result = await generateAutofillNewsletter(templateType, customData);
  
  return {
    html: result.html,
    metadata: {
      subject: result.metadata.subject,
      preheader: result.metadata.preheader,
      postCount: result.data.recentPosts.length,
      estimatedReadTime: result.metadata.estimatedReadTime,
    },
  };
}