'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Zap, 
  Crown,
  Video,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import { cn } from '@/lib/utils';
import { FilterState } from './FilterSidebar';

interface QuickFilter {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  filters: FilterState;
  color: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  count?: number;
  trending?: boolean;
  popular?: boolean;
}

interface QuickFiltersProps {
  onApplyFilter: (filters: FilterState) => void;
  currentFilters?: FilterState;
  onClearFilters?: () => void;
  className?: string;
}

const quickFilterPresets: QuickFilter[] = [
  {
    id: 'trending',
    name: 'Trending Now',
    description: 'Most popular this week',
    icon: TrendingUp,
    filters: { isPopular: true },
    color: 'from-red-400 to-pink-500',
    bgGradient: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
    count: 127,
    trending: true
  },
  {
    id: 'beginner',
    name: 'Beginner Friendly',
    description: 'Perfect for getting started',
    icon: Sparkles,
    filters: { difficultyLevels: ['Beginner'], contentTypes: ['Tutorial', 'Guide'] },
    color: 'from-green-400 to-emerald-500',
    bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
    count: 89,
    popular: true
  },
  {
    id: 'quick-read',
    name: 'Quick Reads',
    description: 'Under 5 minutes',
    icon: Zap,
    filters: { estimatedReadTime: { min: 1, max: 5 } },
    color: 'from-yellow-400 to-orange-500',
    bgGradient: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    borderColor: 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
    count: 234
  },
  {
    id: 'deep-dive',
    name: 'Deep Dives',
    description: '15+ minute reads',
    icon: BookOpen,
    filters: { estimatedReadTime: { min: 15, max: 60 } },
    color: 'from-blue-400 to-indigo-500',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
    count: 156
  },
  {
    id: 'premium',
    name: 'Premium Content',
    description: 'Exclusive member content',
    icon: Crown,
    filters: { isPremium: true },
    color: 'from-purple-400 to-indigo-500',
    bgGradient: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
    count: 67
  },
  {
    id: 'video',
    name: 'With Videos',
    description: 'Contains video content',
    icon: Video,
    filters: { hasVideo: true },
    color: 'from-indigo-400 to-purple-500',
    bgGradient: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700',
    count: 98
  },
  {
    id: 'this-week',
    name: "This Week's Top",
    description: 'Best content from the past 7 days',
    icon: Star,
    filters: { 
      isPopular: true,
      dateRange: { 
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
        to: new Date() 
      }
    },
    color: 'from-teal-400 to-cyan-500',
    bgGradient: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
    textColor: 'text-teal-700 dark:text-teal-300',
    borderColor: 'border-teal-200 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-700',
    count: 43,
    trending: true
  },
  {
    id: 'community',
    name: 'Community Picks',
    description: 'Highest rated by users',
    icon: Users,
    filters: { isPopular: true, difficultyLevels: ['Intermediate', 'Advanced'] },
    color: 'from-rose-400 to-pink-500',
    bgGradient: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20',
    textColor: 'text-rose-700 dark:text-rose-300',
    borderColor: 'border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700',
    count: 76
  }
];

const categoryFilters: QuickFilter[] = [
  {
    id: 'web-dev',
    name: 'Web Development',
    description: 'Frontend, backend, and full-stack',
    icon: Filter,
    filters: { categories: ['Web Development', 'Programming'] },
    color: 'from-blue-400 to-cyan-500',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
    count: 312
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'Latest in artificial intelligence',
    icon: Sparkles,
    filters: { categories: ['AI & ML', 'Technology'] },
    color: 'from-violet-400 to-purple-500',
    bgGradient: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
    textColor: 'text-violet-700 dark:text-violet-300',
    borderColor: 'border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700',
    count: 187
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud',
    description: 'Deployment and infrastructure',
    icon: Filter,
    filters: { categories: ['DevOps', 'Technology'] },
    color: 'from-gray-400 to-slate-500',
    bgGradient: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
    count: 143
  }
];

export default function QuickFilters({
  onApplyFilter,
  currentFilters = {},
  onClearFilters,
  className = ''
}: QuickFiltersProps) {
  const [currentTab, setCurrentTab] = useState<'popular' | 'categories'>('popular');
  const [isScrolled, setIsScrolled] = useState(false);

  const handleFilterClick = useCallback((filter: QuickFilter) => {
    onApplyFilter(filter.filters);
  }, [onApplyFilter]);

  const hasActiveFilters = Object.values(currentFilters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return Boolean(value);
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    }
  };

  const FilterCard = ({ filter }: { filter: QuickFilter }) => {
    const Icon = filter.icon;
    
    return (
      <motion.button
        variants={itemVariants}
        whileHover={{ 
          scale: 1.03,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.97 }}
        onClick={() => handleFilterClick(filter)}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 min-w-[240px]",
          filter.bgGradient,
          filter.borderColor,
          "hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20"
        )}
      >
        {/* Background Gradient Overlay */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
          `bg-gradient-to-br ${filter.color}`
        )} />
        
        {/* Trending/Popular Badge */}
        {(filter.trending || filter.popular) && (
          <div className="absolute top-2 right-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-medium",
                filter.trending ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                filter.popular ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : ""
              )}
            >
              {filter.trending ? '🔥 Hot' : '⭐ Popular'}
            </Badge>
          </div>
        )}
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              `bg-gradient-to-br ${filter.color}`,
              "text-white shadow-lg"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-semibold text-base", filter.textColor)}>
                {filter.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                {filter.description}
              </p>
            </div>
          </div>
          
          {filter.count && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {filter.count.toLocaleString()} posts
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </div>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("w-full", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Quick Filters
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Find exactly what you're looking for with our curated filter presets
          </p>
        </div>
        
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Filters</span>
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setCurrentTab('popular')}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
            currentTab === 'popular'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Popular Filters
        </button>
        <button
          onClick={() => setCurrentTab('categories')}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
            currentTab === 'categories'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          By Category
        </button>
      </div>

      {/* Filter Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {(currentTab === 'popular' ? quickFilterPresets : categoryFilters).map((filter) => (
            <FilterCard key={filter.id} filter={filter} />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* Loading Animation for Demo */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Filters update in real-time</span>
        </div>
      </motion.div>
    </motion.div>
  );
}