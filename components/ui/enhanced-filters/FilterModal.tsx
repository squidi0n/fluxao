'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { 
  X, 
  Filter, 
  RotateCcw,
  Check,
  Search,
  ChevronRight
} from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import { Input } from '../input';
import { cn } from '@/lib/utils';
import FilterSidebar, { FilterState } from './FilterSidebar';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilters: (filters: FilterState) => void;
  onClearAll?: () => void;
  onApply?: () => void;
  availableOptions?: {
    categories?: string[];
    subcategories?: string[];
    contentTypes?: string[];
    difficultyLevels?: string[];
    tags?: string[];
  };
}

type ViewMode = 'overview' | 'categories' | 'tags' | 'settings';

const quickFilterPresets = [
  {
    id: 'beginner',
    name: 'Beginner Friendly',
    description: 'Perfect for getting started',
    filters: { difficultyLevels: ['Beginner'], contentTypes: ['Tutorial', 'Guide'] },
    icon: '🌱',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  },
  {
    id: 'trending',
    name: 'Trending Now',
    description: 'Most popular this week',
    filters: { isPopular: true },
    icon: '🔥',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  },
  {
    id: 'quick-read',
    name: 'Quick Reads',
    description: 'Under 5 minutes',
    filters: { estimatedReadTime: { min: 1, max: 5 } },
    icon: '⚡',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
  },
  {
    id: 'deep-dive',
    name: 'Deep Dives',
    description: '15+ minute reads',
    filters: { estimatedReadTime: { min: 15, max: 60 } },
    icon: '🤿',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  {
    id: 'premium',
    name: 'Premium Content',
    description: 'Exclusive member content',
    filters: { isPremium: true },
    icon: '💎',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  },
  {
    id: 'video',
    name: 'With Videos',
    description: 'Contains video content',
    filters: { hasVideo: true },
    icon: '🎥',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
  }
];

export default function FilterModal({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onClearAll,
  onApply,
  availableOptions
}: FilterModalProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Update local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const activeFiltersCount = Object.values(localFilters).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    if (typeof value === 'object' && value !== null) return count + 1;
    if (typeof value === 'boolean' && value) return count + 1;
    if (typeof value === 'string' && value) return count + 1;
    return count;
  }, 0);

  const applyPreset = useCallback((preset: typeof quickFilterPresets[0]) => {
    const newFilters = { ...localFilters, ...preset.filters };
    setLocalFilters(newFilters);
  }, [localFilters]);

  const handleApply = useCallback(() => {
    onUpdateFilters(localFilters);
    if (onApply) onApply();
    onClose();
  }, [localFilters, onUpdateFilters, onApply, onClose]);

  const handleClearAll = useCallback(() => {
    setLocalFilters({});
    if (onClearAll) onClearAll();
  }, [onClearAll]);

  const filteredOptions = useCallback((options: string[] = []) => {
    if (!searchQuery) return options;
    return options.filter(option => 
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const OverviewView = () => (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Filters
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {quickFilterPresets.map((preset) => (
            <motion.button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {preset.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {preset.description}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation to detailed filters */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Filters
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => setCurrentView('categories')}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                Categories & Types
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={() => setCurrentView('tags')}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Search className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                Tags & Keywords
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Active Filters Preview */}
      {activeFiltersCount > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Filters ({activeFiltersCount})
          </h3>
          <div className="flex flex-wrap gap-2">
            {localFilters.categories?.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {localFilters.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const CategoriesView = () => (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4">
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="space-y-4">
        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Categories</h4>
          <div className="space-y-2">
            {filteredOptions(availableOptions?.categories).map((category) => (
              <label
                key={category}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                <input
                  type="checkbox"
                  checked={localFilters.categories?.includes(category) || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const currentCategories = localFilters.categories || [];
                    const newCategories = checked
                      ? [...currentCategories, category]
                      : currentCategories.filter(c => c !== category);
                    setLocalFilters({
                      ...localFilters,
                      categories: newCategories.length > 0 ? newCategories : undefined
                    });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Content Types */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Content Types</h4>
          <div className="space-y-2">
            {filteredOptions(availableOptions?.contentTypes).map((type) => (
              <label
                key={type}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                <input
                  type="checkbox"
                  checked={localFilters.contentTypes?.includes(type) || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const currentTypes = localFilters.contentTypes || [];
                    const newTypes = checked
                      ? [...currentTypes, type]
                      : currentTypes.filter(t => t !== type);
                    setLocalFilters({
                      ...localFilters,
                      contentTypes: newTypes.length > 0 ? newTypes : undefined
                    });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TagsView = () => (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4">
        <Input
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filteredOptions(availableOptions?.tags).map((tag) => (
          <motion.button
            key={tag}
            onClick={() => {
              const currentTags = localFilters.tags || [];
              const isSelected = currentTags.includes(tag);
              const newTags = isSelected
                ? currentTags.filter(t => t !== tag)
                : [...currentTags, tag];
              setLocalFilters({
                ...localFilters,
                tags: newTags.length > 0 ? newTags : undefined
              });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              localFilters.tags?.includes(tag)
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            )}
          >
            {tag}
            {localFilters.tags?.includes(tag) && (
              <Check className="w-3 h-3 ml-2 inline" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'categories':
        return <CategoriesView />;
      case 'tags':
        return <TagsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {currentView !== 'overview' && (
                  <button
                    onClick={() => setCurrentView('overview')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                  </button>
                )}
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h2>
                  {activeFiltersCount > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeFiltersCount} active
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                >
                  {renderCurrentView()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClearAll}
                className="flex-1"
                disabled={activeFiltersCount === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1"
              >
                Apply Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white/20">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}