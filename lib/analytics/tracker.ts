'use client';

import { analytics } from '../analytics-client';

export interface ArticleTrackingData {
  postId: string;
  slug: string;
  title: string;
  authorId: string;
  category?: string;
  tags?: string[];
  estimatedReadTime?: number;
}

export interface ScrollTrackingOptions {
  milestones: number[]; // e.g., [25, 50, 75, 90, 100]
  throttleMs: number;
}

export interface ReadingProgressData {
  postId: string;
  timeSpent: number; // seconds
  scrollDepth: number; // percentage
  wordsRead: number; // estimated
  engaged: boolean; // meaningful interaction
}

export interface EngagementData {
  type: 'scroll' | 'click' | 'selection' | 'copy' | 'share' | 'comment' | 'like' | 'bookmark';
  element?: string;
  value?: string | number;
  coordinates?: { x: number; y: number };
}

class ArticleAnalyticsTracker {
  private startTime: number = 0;
  private currentArticle: ArticleTrackingData | null = null;
  private scrollMilestones: Set<number> = new Set();
  private maxScrollDepth: number = 0;
  private isVisible: boolean = true;
  private lastActiveTime: number = 0;
  private engagementEvents: EngagementData[] = [];
  private scrollThrottle: number | null = null;
  private visibilityTimer: number | null = null;
  private saveProgressTimer: number | null = null;

  // Configuration
  private readonly config = {
    saveProgressInterval: 30000, // Save progress every 30 seconds
    visibilityTimeout: 5000, // Consider inactive after 5 seconds
    minReadTime: 10, // Minimum seconds to consider as a real read
    scrollThrottle: 100, // Throttle scroll events
    heartbeatInterval: 15000, // Send heartbeat every 15 seconds
    engagementThreshold: 20, // Seconds to consider as engaged
  };

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    if (typeof window === 'undefined') return;

    // Page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Scroll tracking
    window.addEventListener('scroll', this.throttledScrollHandler.bind(this), { passive: true });
    
    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this));
    
    // Text selection
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    
    // Copy events
    document.addEventListener('copy', this.handleCopy.bind(this));
    
    // Beforeunload for saving final state
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Focus/blur for activity detection
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));

    // Initialize activity tracking
    this.lastActiveTime = Date.now();
    this.startActivityTracking();
  }

  public startTracking(article: ArticleTrackingData) {
    this.currentArticle = article;
    this.startTime = Date.now();
    this.scrollMilestones.clear();
    this.maxScrollDepth = 0;
    this.engagementEvents = [];
    
    // Track page view
    analytics.track({
      type: 'article_view',
      path: `/articles/${article.slug}`,
      properties: {
        postId: article.postId,
        title: article.title,
        authorId: article.authorId,
        category: article.category,
        tags: article.tags,
        estimatedReadTime: article.estimatedReadTime,
      },
    });

    // Start periodic progress saves
    this.startProgressSaving();
    
    // Track initial scroll position
    this.updateScrollDepth();
  }

  public stopTracking() {
    if (!this.currentArticle) return;

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    const isEngaged = timeSpent >= this.config.engagementThreshold;

    // Save final reading progress
    this.saveReadingProgress(true);

    // Track article completion
    if (this.maxScrollDepth >= 90 && timeSpent >= this.config.minReadTime) {
      analytics.track({
        type: 'article_completed',
        path: `/articles/${this.currentArticle.slug}`,
        properties: {
          postId: this.currentArticle.postId,
          timeSpent,
          scrollDepth: this.maxScrollDepth,
          engaged: isEngaged,
          engagementEvents: this.engagementEvents.length,
        },
      });
    }

    this.clearTimers();
    this.currentArticle = null;
  }

  private throttledScrollHandler() {
    if (this.scrollThrottle) {
      clearTimeout(this.scrollThrottle);
    }
    
    this.scrollThrottle = window.setTimeout(() => {
      this.updateScrollDepth();
    }, this.config.scrollThrottle);
  }

  private updateScrollDepth() {
    if (!this.currentArticle) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollDepth = Math.min(100, Math.round((scrollTop / documentHeight) * 100));

    if (scrollDepth > this.maxScrollDepth) {
      this.maxScrollDepth = scrollDepth;
      
      // Track milestone scrolls
      const milestones = [25, 50, 75, 90, 100];
      for (const milestone of milestones) {
        if (scrollDepth >= milestone && !this.scrollMilestones.has(milestone)) {
          this.scrollMilestones.add(milestone);
          this.trackEngagement({
            type: 'scroll',
            value: milestone,
          });

          analytics.track({
            type: 'article_scroll',
            path: `/articles/${this.currentArticle.slug}`,
            properties: {
              postId: this.currentArticle.postId,
              milestone,
              timeToMilestone: Math.floor((Date.now() - this.startTime) / 1000),
            },
          });
        }
      }
    }
  }

  private handleClick(event: MouseEvent) {
    if (!this.currentArticle) return;

    const target = event.target as HTMLElement;
    const elementInfo = this.getElementInfo(target);

    this.trackEngagement({
      type: 'click',
      element: elementInfo.type,
      coordinates: { x: event.clientX, y: event.clientY },
    });

    // Track specific click types
    if (target.matches('a[href^="http"]')) {
      // External link
      const href = target.getAttribute('href');
      analytics.track({
        type: 'outbound_click',
        path: `/articles/${this.currentArticle.slug}`,
        properties: {
          postId: this.currentArticle.postId,
          url: href,
          text: target.textContent?.slice(0, 100),
        },
      });
    } else if (target.closest('.share-button')) {
      // Share button
      const shareType = target.getAttribute('data-share-type') || 'unknown';
      this.trackShare(shareType);
    } else if (target.closest('.like-button, .dislike-button')) {
      // Like/dislike buttons
      const isLike = target.closest('.like-button');
      this.trackVote(isLike ? 'like' : 'dislike');
    }
  }

  private handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || !this.currentArticle || selection.toString().trim().length < 10) return;

    const selectedText = selection.toString().slice(0, 200);
    
    this.trackEngagement({
      type: 'selection',
      value: selectedText,
    });

    analytics.track({
      type: 'text_selection',
      path: `/articles/${this.currentArticle.slug}`,
      properties: {
        postId: this.currentArticle.postId,
        selectedLength: selectedText.length,
        selectionPreview: selectedText.slice(0, 50),
      },
    });
  }

  private handleCopy() {
    if (!this.currentArticle) return;

    this.trackEngagement({
      type: 'copy',
    });

    analytics.track({
      type: 'content_copy',
      path: `/articles/${this.currentArticle.slug}`,
      properties: {
        postId: this.currentArticle.postId,
      },
    });
  }

  private handleVisibilityChange() {
    this.isVisible = !document.hidden;
    
    if (this.isVisible) {
      this.lastActiveTime = Date.now();
    } else if (this.currentArticle) {
      // Save progress when tab becomes hidden
      this.saveReadingProgress(false);
    }
  }

  private handleFocus() {
    this.isVisible = true;
    this.lastActiveTime = Date.now();
  }

  private handleBlur() {
    this.isVisible = false;
    if (this.currentArticle) {
      this.saveReadingProgress(false);
    }
  }

  private handleBeforeUnload() {
    if (this.currentArticle) {
      // Use sendBeacon for reliable unload tracking
      const data = {
        postId: this.currentArticle.postId,
        timeSpent: Math.floor((Date.now() - this.startTime) / 1000),
        scrollDepth: this.maxScrollDepth,
        engagementEvents: this.engagementEvents.length,
        completed: false,
      };

      if ('sendBeacon' in navigator) {
        navigator.sendBeacon('/api/analytics/reading-progress', JSON.stringify(data));
      }
    }
  }

  private startActivityTracking() {
    if (this.visibilityTimer) {
      clearInterval(this.visibilityTimer);
    }

    this.visibilityTimer = window.setInterval(() => {
      if (this.isVisible && Date.now() - this.lastActiveTime > this.config.visibilityTimeout) {
        this.isVisible = false;
      }
    }, 1000);
  }

  private startProgressSaving() {
    if (this.saveProgressTimer) {
      clearInterval(this.saveProgressTimer);
    }

    this.saveProgressTimer = window.setInterval(() => {
      if (this.isVisible) {
        this.saveReadingProgress(false);
      }
    }, this.config.saveProgressInterval);
  }

  private async saveReadingProgress(isFinal: boolean = false) {
    if (!this.currentArticle) return;

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    const wordsRead = this.estimateWordsRead();
    const engaged = timeSpent >= this.config.engagementThreshold;

    const progressData: ReadingProgressData = {
      postId: this.currentArticle.postId,
      timeSpent,
      scrollDepth: this.maxScrollDepth,
      wordsRead,
      engaged,
    };

    try {
      await fetch('/api/analytics/reading-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...progressData,
          isFinal,
          engagementEvents: this.engagementEvents.length,
        }),
      });
    } catch (error) {
      console.warn('Failed to save reading progress:', error);
    }
  }

  private estimateWordsRead(): number {
    if (!this.currentArticle?.estimatedReadTime) return 0;
    
    // Rough estimation: average reading speed is 200 words per minute
    const wordsPerMinute = 200;
    const totalWords = this.currentArticle.estimatedReadTime * wordsPerMinute;
    const wordsRead = Math.min(
      totalWords,
      Math.floor((totalWords * this.maxScrollDepth) / 100)
    );
    
    return wordsRead;
  }

  private trackEngagement(data: EngagementData) {
    this.engagementEvents.push({
      ...data,
      timestamp: Date.now(),
    } as any);
    
    this.lastActiveTime = Date.now();
    this.isVisible = true;
  }

  private getElementInfo(element: HTMLElement) {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;
    const id = element.id;
    
    return {
      type: `${tagName}${id ? `#${id}` : ''}${className ? `.${className.split(' ')[0]}` : ''}`,
      text: element.textContent?.slice(0, 50),
    };
  }

  private trackShare(method: string) {
    if (!this.currentArticle) return;

    this.trackEngagement({
      type: 'share',
      value: method,
    });

    analytics.trackShareArticle(method, this.currentArticle.slug);
  }

  private trackVote(type: 'like' | 'dislike') {
    if (!this.currentArticle) return;

    this.trackEngagement({
      type: type === 'like' ? 'like' : 'dislike',
    });

    analytics.track({
      type: 'article_vote',
      path: `/articles/${this.currentArticle.slug}`,
      properties: {
        postId: this.currentArticle.postId,
        voteType: type,
      },
    });
  }

  public trackComment() {
    if (!this.currentArticle) return;

    this.trackEngagement({
      type: 'comment',
    });

    analytics.track({
      type: 'article_comment',
      path: `/articles/${this.currentArticle.slug}`,
      properties: {
        postId: this.currentArticle.postId,
      },
    });
  }

  public trackBookmark() {
    if (!this.currentArticle) return;

    this.trackEngagement({
      type: 'bookmark',
    });

    analytics.track({
      type: 'article_bookmark',
      path: `/articles/${this.currentArticle.slug}`,
      properties: {
        postId: this.currentArticle.postId,
      },
    });
  }

  private clearTimers() {
    if (this.scrollThrottle) {
      clearTimeout(this.scrollThrottle);
      this.scrollThrottle = null;
    }
    
    if (this.visibilityTimer) {
      clearInterval(this.visibilityTimer);
      this.visibilityTimer = null;
    }
    
    if (this.saveProgressTimer) {
      clearInterval(this.saveProgressTimer);
      this.saveProgressTimer = null;
    }
  }

  // Public methods for external use
  public getCurrentProgress() {
    if (!this.currentArticle) return null;

    return {
      postId: this.currentArticle.postId,
      timeSpent: Math.floor((Date.now() - this.startTime) / 1000),
      scrollDepth: this.maxScrollDepth,
      engaged: this.engagementEvents.length > 3,
    };
  }

  public isTracking(): boolean {
    return this.currentArticle !== null;
  }
}

// Singleton instance
export const articleTracker = new ArticleAnalyticsTracker();

// React hook for components
export function useArticleTracker() {
  return {
    startTracking: articleTracker.startTracking.bind(articleTracker),
    stopTracking: articleTracker.stopTracking.bind(articleTracker),
    trackComment: articleTracker.trackComment.bind(articleTracker),
    trackBookmark: articleTracker.trackBookmark.bind(articleTracker),
    getCurrentProgress: articleTracker.getCurrentProgress.bind(articleTracker),
    isTracking: articleTracker.isTracking.bind(articleTracker),
  };
}