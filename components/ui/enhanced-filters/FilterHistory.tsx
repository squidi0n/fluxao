'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { 
  Clock, 
  Star, 
  X, 
  RotateCcw,
  Search,
  Bookmark,
  TrendingUp,
  Heart
} from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import { cn } from '@/lib/utils';
import { FilterState } from './FilterSidebar';
import FilterPill from './FilterPill';

interface FilterHistoryItem {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
  timestamp: Date;
  useCount: number;
  isFavorite?: boolean;
  isPreset?: boolean;
  tags?: string[];
}

interface FilterHistoryProps {
  onApplyFilter: (filters: FilterState) => void;
  onSavePreset?: (name: string, filters: FilterState) => void;
  onDeleteHistoryItem?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onClearHistory?: () => void;
  className?: string;
  maxItems?: number;
}

// Mock data - in real app, this would come from localStorage or API
const mockHistoryItems: FilterHistoryItem[] = [
  {
    id: '1',
    name: 'React Tutorials for Beginners',
    description: 'Beginner-friendly React content',
    filters: { 
      categories: ['Web Development'], 
      tags: ['react'], 
      difficultyLevels: ['Beginner'],
      contentTypes: ['Tutorial'] 
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    useCount: 5,
    isFavorite: true
  },
  {
    id: '2',
    name: 'Advanced TypeScript Patterns',
    filters: { 
      tags: ['typescript'], 
      difficultyLevels: ['Advanced'],
      estimatedReadTime: { min: 10, max: 30 }
    },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    useCount: 3,
    isFavorite: false
  },
  {
    id: '3',
    name: 'Quick Reads - This Week',
    filters: { 
      estimatedReadTime: { min: 1, max: 5 },
      dateRange: { 
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
        to: new Date() 
      }
    },
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    useCount: 8,
    isFavorite: true
  },
  {
    id: '4',
    name: 'Premium AI Content',
    filters: { 
      categories: ['AI & ML'], 
      isPremium: true,
      isPopular: true 
    },
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    useCount: 2,
    isPreset: true
  },
  {
    id: '5',
    name: 'Video Tutorials - DevOps',
    filters: { 
      categories: ['DevOps'], 
      hasVideo: true,
      contentTypes: ['Tutorial'] 
    },
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    useCount: 4,
    isFavorite: false
  }
];

export default function FilterHistory({
  onApplyFilter,
  onSavePreset,
  onDeleteHistoryItem,
  onToggleFavorite,
  onClearHistory,
  className = '',
  maxItems = 10
}: FilterHistoryProps) {
  const [historyItems, setHistoryItems] = useState<FilterHistoryItem[]>(mockHistoryItems);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'presets' | 'recent'>('all');

  const filteredItems = historyItems
    .filter(item => {
      switch (filter) {
        case 'favorites':
          return item.isFavorite;
        case 'presets':
          return item.isPreset;
        case 'recent':
          return item.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, showAll ? maxItems : 5);

  const handleApplyFilter = useCallback((item: FilterHistoryItem) => {
    // Increment use count
    setHistoryItems(prev =>
      prev.map(historyItem =>
        historyItem.id === item.id
          ? { ...historyItem, useCount: historyItem.useCount + 1, timestamp: new Date() }
          : historyItem
      )
    );
    onApplyFilter(item.filters);
  }, [onApplyFilter]);

  const handleToggleFavorite = useCallback((id: string) => {
    setHistoryItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
    if (onToggleFavorite) onToggleFavorite(id);
  }, [onToggleFavorite]);

  const handleDeleteItem = useCallback((id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
    if (onDeleteHistoryItem) onDeleteHistoryItem(id);
  }, [onDeleteHistoryItem]);

  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const getFilterSummary = (filters: FilterState): string[] => {
    const summary: string[] = [];
    
    if (filters.categories?.length) {
      summary.push(`${filters.categories.length} categories`);
    }
    if (filters.tags?.length) {
      summary.push(`${filters.tags.length} tags`);
    }
    if (filters.difficultyLevels?.length) {
      summary.push(`${filters.difficultyLevels[0]} level`);
    }
    if (filters.isPremium) {
      summary.push('Premium');
    }
    if (filters.hasVideo) {
      summary.push('Video');
    }
    if (filters.estimatedReadTime) {
      summary.push('Time filtered');
    }
    
    return summary.slice(0, 3);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const HistoryItem = ({ item }: { item: FilterHistoryItem }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, scale: 1.02 }}
      className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {item.name}
            </h3>
            {item.isPreset && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Preset
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {item.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleToggleFavorite(item.id)}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              item.isFavorite 
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" 
                : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
          >
            <Heart className={cn("w-4 h-4", item.isFavorite && "fill-current")} />
          </button>
          <button
            onClick={() => handleDeleteItem(item.id)}
            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex flex-wrap gap-1 mb-3">
        {getFilterSummary(item.filters).map((summary, index) => (
          <FilterPill
            key={index}
            label=""
            value={summary}
            variant="default"
            isAnimated={false}
            className="text-xs py-1 px-2 h-auto"
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(item.timestamp)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Used {item.useCount}x</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleApplyFilter(item)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3 text-xs"
        >
          Apply
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filter History
          </h2>
        </div>
        
        {historyItems.length > 0 && onClearHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {[
          { key: 'all', label: 'All', icon: Search },
          { key: 'favorites', label: 'Favorites', icon: Heart },
          { key: 'presets', label: 'Presets', icon: Bookmark },
          { key: 'recent', label: 'Recent', icon: Clock }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={cn(
              "flex items-center space-x-1 flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200",
              filter === key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* History Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">
            {filter === 'all' 
              ? 'No filter history yet' 
              : `No ${filter} found`
            }
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Start filtering content to build your history
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </AnimatePresence>
          
          {historyItems.length > 5 && !showAll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center pt-4"
            >
              <Button
                variant="ghost"
                onClick={() => setShowAll(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Show {historyItems.length - 5} more
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}