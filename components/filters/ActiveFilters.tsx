'use client';

import { motion, AnimatePresence } from 'framer-motion';
import FilterChip from './FilterChip';
import { RotateCcw } from 'lucide-react';

export interface FilterState {
  categories?: string[];
  subcategories?: string[];
  contentTypes?: string[];
  difficultyLevels?: string[];
  tags?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  estimatedReadTime?: {
    min?: number;
    max?: number;
  };
  searchQuery?: string;
}

interface ActiveFiltersProps {
  filters: FilterState;
  onUpdateFilters: (filters: FilterState) => void;
  onClearAll?: () => void;
  className?: string;
}

export default function ActiveFilters({
  filters,
  onUpdateFilters,
  onClearAll,
  className = ''
}: ActiveFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return Boolean(value);
  });

  const removeFilter = (filterType: keyof FilterState, value?: string) => {
    const newFilters = { ...filters };
    
    if (Array.isArray(newFilters[filterType]) && value) {
      newFilters[filterType] = (newFilters[filterType] as string[]).filter(v => v !== value);
    } else if (filterType === 'searchQuery' || filterType === 'dateRange' || filterType === 'estimatedReadTime') {
      delete newFilters[filterType];
    }
    
    onUpdateFilters(newFilters);
  };

  const formatDateRange = (dateRange: { from?: Date; to?: Date }) => {
    if (dateRange.from && dateRange.to) {
      return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
    }
    if (dateRange.from) {
      return `From ${dateRange.from.toLocaleDateString()}`;
    }
    if (dateRange.to) {
      return `Until ${dateRange.to.toLocaleDateString()}`;
    }
    return '';
  };

  const formatReadTimeRange = (readTime: { min?: number; max?: number }) => {
    if (readTime.min && readTime.max) {
      return `${readTime.min}-${readTime.max} min`;
    }
    if (readTime.min) {
      return `${readTime.min}+ min`;
    }
    if (readTime.max) {
      return `≤${readTime.max} min`;
    }
    return '';
  };

  if (!hasActiveFilters) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-b border-gray-200 dark:border-gray-700 py-4 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Filters
          </h3>
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {/* Search Query */}
            {filters.searchQuery && (
              <FilterChip
                key="search"
                label="Search"
                value={filters.searchQuery}
                variant="active"
                onRemove={() => removeFilter('searchQuery')}
              />
            )}

            {/* Categories */}
            {filters.categories?.map(category => (
              <FilterChip
                key={`category-${category}`}
                label="Category"
                value={category}
                variant="active"
                onRemove={() => removeFilter('categories', category)}
              />
            ))}

            {/* Subcategories */}
            {filters.subcategories?.map(subcategory => (
              <FilterChip
                key={`subcategory-${subcategory}`}
                label="Subcategory"
                value={subcategory}
                variant="active"
                onRemove={() => removeFilter('subcategories', subcategory)}
              />
            ))}

            {/* Content Types */}
            {filters.contentTypes?.map(type => (
              <FilterChip
                key={`content-type-${type}`}
                label="Content Type"
                value={type}
                variant="active"
                onRemove={() => removeFilter('contentTypes', type)}
              />
            ))}

            {/* Difficulty Levels */}
            {filters.difficultyLevels?.map(level => (
              <FilterChip
                key={`difficulty-${level}`}
                label="Difficulty"
                value={level}
                variant="active"
                onRemove={() => removeFilter('difficultyLevels', level)}
              />
            ))}

            {/* Tags */}
            {filters.tags?.map(tag => (
              <FilterChip
                key={`tag-${tag}`}
                label="Tag"
                value={tag}
                variant="active"
                onRemove={() => removeFilter('tags', tag)}
              />
            ))}

            {/* Date Range */}
            {filters.dateRange && (
              <FilterChip
                key="date-range"
                label="Date Range"
                value={formatDateRange(filters.dateRange)}
                variant="active"
                onRemove={() => removeFilter('dateRange')}
              />
            )}

            {/* Read Time Range */}
            {filters.estimatedReadTime && (
              <FilterChip
                key="read-time"
                label="Read Time"
                value={formatReadTimeRange(filters.estimatedReadTime)}
                variant="active"
                onRemove={() => removeFilter('estimatedReadTime')}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}