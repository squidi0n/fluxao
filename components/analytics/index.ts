// Export all analytics components
export { ArticleStats } from './ArticleStats';
export { AuthorDashboard } from './AuthorDashboard';
export { ReadingProgress, ReadingProgressBar, useReadingProgress } from './ReadingProgress';
export { EngagementTracker, EngagementIndicator } from './EngagementTracker';

// Re-export existing components for convenience
export { EventTracker } from './EventTracker';
export { ShareButton } from './ShareButton';

// Export analytics hooks and utilities from the tracker
export { 
  useArticleTracker,
  articleTracker,
  type ArticleTrackingData,
  type ReadingProgressData,
  type EngagementData
} from '@/lib/analytics/tracker';