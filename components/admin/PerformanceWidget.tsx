'use client';

import { TrendingUp, Users, Eye, Calendar, Zap, Target, Award, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

interface PerformanceWidgetProps {
  dailyViews: number;
  monthlyViews: number;
  totalViews: number;
  publishedPostCount: number;
  newUsersCount: number;
}

export function PerformanceWidget({ 
  dailyViews, 
  monthlyViews, 
  totalViews, 
  publishedPostCount, 
  newUsersCount 
}: PerformanceWidgetProps) {
  
  // Calculate performance metrics
  const avgViewsPerPost = publishedPostCount > 0 ? Math.round(totalViews / publishedPostCount) : 0;
  const dailyGrowthRate = monthlyViews > 0 ? ((dailyViews / monthlyViews) * 100).toFixed(1) : '0.0';
  const engagementScore = Math.min(Math.round((dailyViews / Math.max(totalViews, 1)) * 100 * 30), 100); // Scaled engagement metric

  const performanceMetrics = [
    {
      title: 'Tägl. Performance',
      value: dailyViews,
      subtitle: 'Views heute',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500',
      change: `+${dailyGrowthRate}%`,
      changeColor: 'text-green-600'
    },
    {
      title: 'Engagement Rate',
      value: engagementScore,
      subtitle: 'Performance Score',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      change: 'Excellent',
      changeColor: 'text-emerald-600',
      suffix: '%'
    },
    {
      title: 'Content ROI',
      value: avgViewsPerPost,
      subtitle: 'Views pro Post',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      change: 'Trending Up',
      changeColor: 'text-purple-600'
    },
    {
      title: 'Growth Velocity',
      value: newUsersCount,
      subtitle: 'Neue User',
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
      change: 'This Week',
      changeColor: 'text-amber-600'
    }
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Performance Overview Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Performance Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time KPIs & Metrics
              </p>
            </div>
          </div>
        </div>

        {/* Performance Score */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
              {/* Circular progress background */}
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${engagementScore * 2.51} 251`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter value={engagementScore} />%
                </span>
              </div>
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Overall Performance
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              System Health Score
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="space-y-4">
            {performanceMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <motion.div
                  key={metric.title}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-gray-600/50 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color} shadow-lg`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {metric.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      <AnimatedCounter value={metric.value} />
                      {metric.suffix || ''}
                    </p>
                    <p className={`text-xs font-medium ${metric.changeColor}`}>
                      {metric.change}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                Smart Insights
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered recommendations
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Insight Cards */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Traffic Trend
              </p>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {dailyViews > monthlyViews / 30 
                ? "Überdurchschnittlicher Traffic heute. Guter Zeitpunkt für neue Inhalte!"
                : "Traffic ist stabil. Überlege neue Content-Strategien."
              }
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                Content Performance
              </p>
            </div>
            <p className="text-xs text-green-700 dark:text-green-400">
              {avgViewsPerPost > 100 
                ? `Excellent! Deine Posts erreichen durchschnittlich ${avgViewsPerPost} Views.`
                : "Content könnte mehr Engagement generieren. Prüfe SEO & Social Media."
              }
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                Growth Opportunity
              </p>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              {newUsersCount > 5 
                ? `Starkes Wachstum! ${newUsersCount} neue User diese Woche.`
                : "Fokus auf Nutzerakquise. Newsletter und Social Media ausbauen."
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}