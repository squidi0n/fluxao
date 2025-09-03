'use client';

import { useEffect } from 'react';
import { 
  ArticleStats, 
  ReadingProgress, 
  EngagementTracker,
  EngagementIndicator,
  useArticleTracker 
} from '@/components/analytics';

interface ArticleWithAnalyticsProps {
  article: {
    id: string;
    slug: string;
    title: string;
    content: string;
    authorId: string;
    author: {
      id: string;
      name: string;
      username: string;
    };
    category?: {
      name: string;
      slug: string;
    };
    tags?: Array<{
      name: string;
      slug: string;
    }>;
    estimatedReadTime?: number;
    publishedAt: string;
  };
}

/**
 * Example implementation showing how to integrate the analytics system
 * into an article page. This demonstrates:
 * 
 * 1. Automatic article tracking
 * 2. Reading progress monitoring
 * 3. Engagement tracking
 * 4. Real-time analytics display
 */
export default function ArticleWithAnalytics({ article }: ArticleWithAnalyticsProps) {
  const { 
    startTracking, 
    stopTracking, 
    trackComment, 
    trackBookmark 
  } = useArticleTracker();

  useEffect(() => {
    // Start tracking when the article loads
    startTracking({
      postId: article.id,
      slug: article.slug,
      title: article.title,
      authorId: article.authorId,
      category: article.category?.name,
      tags: article.tags?.map(tag => tag.name),
      estimatedReadTime: article.estimatedReadTime,
    });

    // Stop tracking when component unmounts
    return () => {
      stopTracking();
    };
  }, [article.id]);

  const handleComment = () => {
    // Track comment interaction
    trackComment();
    // Your comment logic here
  };

  const handleBookmark = () => {
    // Track bookmark interaction
    trackBookmark();
    // Your bookmark logic here
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Reading Progress Bar - Fixed at top */}
      <ReadingProgress 
        showEstimate={true}
        estimatedReadTime={article.estimatedReadTime}
        wordsCount={article.content.split(' ').length}
      />

      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              By {article.author.name}
            </span>
            <span className="text-gray-400">•</span>
            <time className="text-gray-600">
              {new Date(article.publishedAt).toLocaleDateString()}
            </time>
            {article.estimatedReadTime && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {article.estimatedReadTime} min read
                </span>
              </>
            )}
          </div>
          
          {/* Live engagement indicator */}
          <EngagementIndicator postId={article.id} />
        </div>

        {/* Categories and Tags */}
        {(article.category || article.tags?.length) && (
          <div className="flex items-center space-x-2 mb-6">
            {article.category && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {article.category.name}
              </span>
            )}
            {article.tags?.map((tag) => (
              <span key={tag.slug} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Article Content */}
        <article className="lg:col-span-3">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          
          {/* Action Buttons */}
          <div className="mt-8 flex items-center space-x-4 pt-6 border-t">
            <button
              onClick={handleComment}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <span>💬</span>
              <span>Comment</span>
            </button>
            
            <button
              onClick={handleBookmark}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              <span>🔖</span>
              <span>Bookmark</span>
            </button>

            {/* Share buttons would trigger trackShare automatically if using our ShareButton component */}
          </div>
        </article>

        {/* Sidebar with Analytics */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Article Performance Stats */}
          <ArticleStats 
            postId={article.id}
            slug={article.slug}
            showDetailed={true}
          />
          
          {/* Engagement Tracking */}
          <EngagementTracker
            postId={article.id}
            slug={article.slug}
            title={article.title}
            authorId={article.authorId}
            realTimeUpdates={true}
          />
          
          {/* Related articles, newsletter signup, etc. would go here */}
        </aside>
      </div>

      {/* Comments Section (if implemented) */}
      <section className="mt-12 pt-8 border-t">
        <h3 className="text-2xl font-bold mb-6">Comments</h3>
        {/* Your comments component would go here */}
        <p className="text-gray-600">
          Comments section would be implemented here. 
          Each comment interaction would be tracked automatically.
        </p>
      </section>
    </div>
  );
}

/**
 * Usage Notes:
 * 
 * 1. Privacy Compliance:
 *    - The system respects user consent preferences
 *    - IP addresses are hashed for privacy
 *    - Personal data is not stored without consent
 * 
 * 2. Performance:
 *    - Analytics tracking is throttled to prevent performance issues
 *    - Events are batched when possible
 *    - Fallbacks are provided for edge cases
 * 
 * 3. Customization:
 *    - All components accept className props for styling
 *    - Analytics thresholds can be configured
 *    - Real-time updates can be disabled for performance
 * 
 * 4. API Integration:
 *    - Automatically tracks to /api/analytics/track
 *    - Reading progress saved to /api/analytics/reading-progress  
 *    - Stats fetched from /api/analytics/article/[id]
 *    - Engagement data from /api/analytics/engagement/[id]
 * 
 * 5. Error Handling:
 *    - Analytics failures don't break the user experience
 *    - Graceful degradation when APIs are unavailable
 *    - Comprehensive logging for debugging
 */