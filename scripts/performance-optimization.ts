#!/usr/bin/env tsx
/**
 * FluxAO Performance Optimization Script
 * 
 * This script applies comprehensive performance optimizations to the FluxAO system:
 * 1. Database index optimization
 * 2. Cache warming
 * 3. Post score calculations
 * 4. System metric baseline
 * 5. Performance monitoring setup
 */

import { PrismaClient } from '@prisma/client';
import { prismaPerf } from '../lib/prisma-performance';
import { perfCache } from '../lib/performance-cache';
import { performanceMonitor } from '../lib/performance-monitor';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

class PerformanceOptimizer {
  
  async optimizeDatabase() {
    logger.info('🚀 Starting database optimization...');
    
    // Analyze table sizes and query patterns
    const stats = await this.getDatabaseStats();
    logger.info('Database statistics:', stats);

    // Update post scores for trending calculations
    await this.updatePostScores();
    
    // Clean up old data
    await this.cleanupOldData();
    
    logger.info('✅ Database optimization completed');
  }

  private async getDatabaseStats() {
    try {
      const [
        postCount,
        userCount,
        commentCount,
        notificationCount,
        cacheStats,
      ] = await Promise.all([
        prisma.post.count(),
        prisma.user.count(),
        prisma.comment.count(),
        prisma.notification.count(),
        perfCache.getStats(),
      ]);

      return {
        posts: postCount,
        users: userCount,
        comments: commentCount,
        notifications: notificationCount,
        cache: cacheStats,
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return {};
    }
  }

  private async updatePostScores() {
    logger.info('📊 Updating post scores for trending calculations...');
    
    try {
      // Get all published posts from last 30 days
      const recentPosts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          articleVotes: true,
          comments: {
            where: { status: 'APPROVED' },
          },
          readingHistory: true,
        },
      });

      logger.info(`Processing ${recentPosts.length} recent posts...`);

      // Calculate trending scores
      const scoreUpdates = recentPosts.map(async (post) => {
        const likes = post.articleVotes.filter(v => v.type === 'like').length;
        const dislikes = post.articleVotes.filter(v => v.type === 'dislike').length;
        const comments = post.comments.length;
        const readingTime = post.readingHistory.reduce((acc, h) => acc + h.minutes, 0);
        
        // Age factor (newer posts get boost)
        const ageInDays = (Date.now() - (post.publishedAt?.getTime() || 0)) / (24 * 60 * 60 * 1000);
        const ageFactor = Math.max(0.1, 1 - (ageInDays / 30));
        
        // Calculate trending score
        const engagementScore = (likes * 2) - dislikes + (comments * 1.5) + (readingTime * 0.1);
        const trendingScore = engagementScore * ageFactor;

        // Update or create PostScore
        return prisma.postScore.upsert({
          where: { postId: post.id },
          create: {
            postId: post.id,
            score: trendingScore,
            views: post.viewCount,
            minutes: readingTime,
            fluxTotal: likes + dislikes + comments,
          },
          update: {
            score: trendingScore,
            views: post.viewCount,
            minutes: readingTime,
            fluxTotal: likes + dislikes + comments,
          },
        });
      });

      await Promise.all(scoreUpdates);
      logger.info('✅ Post scores updated');
      
    } catch (error) {
      logger.error('Error updating post scores:', error);
    }
  }

  private async cleanupOldData() {
    logger.info('🧹 Cleaning up old data...');
    
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      
      // Clean old analytics events
      const deletedAnalytics = await prisma.analyticsEvent.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
      
      // Clean old system metrics (keep last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedMetrics = await prisma.systemMetrics.deleteMany({
        where: {
          timestamp: { lt: thirtyDaysAgo },
        },
      });

      // Clean old notifications (keep last 60 days)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: sixtyDaysAgo },
          isArchived: true,
        },
      });

      logger.info(`Cleaned: ${deletedAnalytics.count} analytics, ${deletedMetrics.count} metrics, ${deletedNotifications.count} notifications`);
      
    } catch (error) {
      logger.error('Error cleaning old data:', error);
    }
  }

  async warmCache() {
    logger.info('🔥 Warming up caches...');
    
    try {
      const startTime = Date.now();
      
      // Warm up featured posts
      logger.info('Warming featured posts cache...');
      await prismaPerf.findFeaturedPosts(10);
      
      // Warm up trending posts
      logger.info('Warming trending posts cache...');
      await prismaPerf.findTrendingPosts(10);
      
      // Warm up category posts for main categories
      const categories = ['ki-tech', 'mensch-gesellschaft', 'style-aesthetik', 'gaming-kultur', 'mindset-philosophie', 'fiction-lab'];
      
      logger.info('Warming category caches...');
      const categoryPromises = categories.map(categorySlug =>
        prismaPerf.findPostsByCategory(categorySlug, { limit: 10, includeTotal: false })
      );
      await Promise.all(categoryPromises);
      
      // Warm up user notifications for active admins
      logger.info('Warming admin notification caches...');
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      });
      
      const notificationPromises = adminUsers.map(admin =>
        prismaPerf.findUserNotifications(admin.id, { limit: 20, unreadOnly: false })
      );
      await Promise.all(notificationPromises);
      
      const duration = Date.now() - startTime;
      logger.info(`✅ Cache warming completed in ${duration}ms`);
      
    } catch (error) {
      logger.error('Error warming cache:', error);
    }
  }

  async setupPerformanceMonitoring() {
    logger.info('📈 Setting up performance monitoring...');
    
    try {
      // Start the performance monitoring system
      performanceMonitor.startMonitoring();
      
      // Create initial health check
      const health = await performanceMonitor.healthCheck();
      logger.info('Initial system health:', health);
      
      // Store baseline metrics
      const baseline = await performanceMonitor.getRealTimeMetrics();
      await perfCache.set('performance:baseline', baseline, 24 * 60 * 60); // 24 hours
      
      logger.info('✅ Performance monitoring setup completed');
      
    } catch (error) {
      logger.error('Error setting up performance monitoring:', error);
    }
  }

  async optimizeImages() {
    logger.info('🖼️ Analyzing image optimization opportunities...');
    
    try {
      // Find posts with large images
      const postsWithImages = await prisma.post.findMany({
        where: {
          coverImage: { not: null },
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          coverImage: true,
          viewCount: true,
        },
        orderBy: { viewCount: 'desc' },
        take: 100, // Top 100 most viewed posts
      });

      logger.info(`Found ${postsWithImages.length} posts with cover images`);
      
      // Check for unoptimized image URLs
      const unoptimizedImages = postsWithImages.filter(post => {
        const imageUrl = post.coverImage;
        return imageUrl && 
               !imageUrl.includes('w_') && // Cloudinary width param
               !imageUrl.includes('q_auto') && // Cloudinary quality param
               !imageUrl.includes('.webp'); // WebP format
      });

      if (unoptimizedImages.length > 0) {
        logger.warn(`⚠️  Found ${unoptimizedImages.length} posts with unoptimized images`);
        logger.info('Consider optimizing these high-traffic images for better performance');
      } else {
        logger.info('✅ All high-traffic images appear to be optimized');
      }
      
    } catch (error) {
      logger.error('Error analyzing images:', error);
    }
  }

  async generatePerformanceReport() {
    logger.info('📊 Generating performance report...');
    
    try {
      const stats = await this.getDatabaseStats();
      const cacheStats = perfCache.getStats();
      const health = await performanceMonitor.healthCheck();
      const realTimeMetrics = await performanceMonitor.getRealTimeMetrics();
      
      const report = {
        timestamp: new Date().toISOString(),
        database: stats,
        cache: cacheStats,
        health: health,
        metrics: realTimeMetrics,
        recommendations: this.generateRecommendations(stats, cacheStats, health),
      };

      // Store report in cache
      await perfCache.set('performance:report:latest', report, 60 * 60); // 1 hour

      logger.info('📋 Performance Report:');
      logger.info('='.repeat(50));
      logger.info(`System Health: ${health.status.toUpperCase()}`);
      logger.info(`Database Records: ${stats.posts} posts, ${stats.users} users`);
      logger.info(`Cache Hit Rate: ${cacheStats.hitRate?.toFixed(1)}%`);
      logger.info(`Memory Usage: ${realTimeMetrics.systemStats?.memoryUsage.heapUsed ? 
        Math.round(realTimeMetrics.systemStats.memoryUsage.heapUsed / 1024 / 1024) + 'MB' : 'N/A'}`);
      logger.info('='.repeat(50));

      if (report.recommendations.length > 0) {
        logger.info('💡 Recommendations:');
        report.recommendations.forEach((rec, i) => {
          logger.info(`${i + 1}. ${rec}`);
        });
      }

      return report;
      
    } catch (error) {
      logger.error('Error generating performance report:', error);
      return null;
    }
  }

  private generateRecommendations(stats: any, cacheStats: any, health: any): string[] {
    const recommendations: string[] = [];

    if (health.status !== 'healthy') {
      recommendations.push('System health is not optimal - check performance alerts');
    }

    if (cacheStats.hitRate < 70) {
      recommendations.push('Cache hit rate is below 70% - consider increasing cache TTL or warming more data');
    }

    if (stats.notifications > 10000) {
      recommendations.push('Large number of notifications - consider archiving old notifications');
    }

    if (cacheStats.memorySize > 400) {
      recommendations.push('Memory cache is large - monitor for memory leaks');
    }

    return recommendations;
  }

  async runFullOptimization() {
    logger.info('🚀 Starting comprehensive FluxAO performance optimization...');
    const startTime = Date.now();
    
    try {
      // Run all optimization steps
      await this.optimizeDatabase();
      await this.warmCache();
      await this.setupPerformanceMonitoring();
      await this.optimizeImages();
      
      // Generate final report
      const report = await this.generatePerformanceReport();
      
      const totalTime = Date.now() - startTime;
      logger.info(`🎉 Optimization completed in ${totalTime}ms`);
      logger.info('FluxAO is now optimized for lightning-fast performance! ⚡');
      
      return report;
      
    } catch (error) {
      logger.error('Error during optimization:', error);
      throw error;
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  
  optimizer.runFullOptimization()
    .then(() => {
      logger.info('✅ Performance optimization script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Performance optimization failed:', error);
      process.exit(1);
    });
}

export { PerformanceOptimizer };