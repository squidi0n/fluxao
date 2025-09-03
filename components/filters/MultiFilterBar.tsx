'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  Search, 
  ChevronDown,
  Calendar,
  Clock,
  Tag,
  BookOpen,
  Layers,
  Target
} from 'lucide-react';
import { FilterState } from './ActiveFilters';

interface MultiFilterBarProps {
  filters: FilterState;
  onUpdateFilters: (filters: FilterState) => void;
  availableCategories?: string[];
  availableTags?: string[];
  className?: string;
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export default function MultiFilterBar({
  filters,
  onUpdateFilters,
  availableCategories = [],
  availableTags = [],
  className = ''
}: MultiFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');

  // Content type options
  const contentTypes: FilterOption[] = [
    { value: 'TUTORIAL', label: 'Tutorial' },
    { value: 'NEWS', label: 'News' },
    { value: 'OPINION', label: 'Opinion' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'DEEP_DIVE', label: 'Deep Dive' }
  ];

  // Difficulty level options
  const difficultyLevels: FilterOption[] = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' }
  ];

  // Subcategory options (these could be fetched from API in real implementation)
  const subcategories: FilterOption[] = [
    { value: 'machine-learning', label: 'Machine Learning' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'blockchain', label: 'Blockchain' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'mobile-development', label: 'Mobile Development' }
  ];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onUpdateFilters({
      ...filters,
      searchQuery: value || undefined
    });
  };

  const toggleArrayFilter = (filterType: keyof FilterState, value: string) => {
    const currentArray = (filters[filterType] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    onUpdateFilters({
      ...filters,
      [filterType]: newArray.length > 0 ? newArray : undefined
    });
  };

  const setReadTimeRange = (min?: number, max?: number) => {
    onUpdateFilters({
      ...filters,
      estimatedReadTime: (min !== undefined || max !== undefined) ? { min, max } : undefined
    });
  };

  const FilterSection = ({ 
    icon: Icon, 
    title, 
    children 
  }: { 
    icon: any; 
    title: string; 
    children: React.ReactNode; 
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon className="w-4 h-4" />
        {title}
      </div>
      {children}
    </div>
  );

  const FilterCheckbox = ({ 
    label, 
    checked, 
    onChange, 
    count 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: () => void; 
    count?: number; 
  }) => (
    <label className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      {count && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {count}
        </span>
      )}
    </label>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Categories */}
              {availableCategories.length > 0 && (
                <FilterSection icon={Layers} title="Categories">
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {availableCategories.map(category => (
                      <FilterCheckbox
                        key={category}
                        label={category}
                        checked={(filters.categories || []).includes(category)}
                        onChange={() => toggleArrayFilter('categories', category)}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Subcategories */}
              <FilterSection icon={Target} title="Subcategories">
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {subcategories.map(subcategory => (
                    <FilterCheckbox
                      key={subcategory.value}
                      label={subcategory.label}
                      checked={(filters.subcategories || []).includes(subcategory.value)}
                      onChange={() => toggleArrayFilter('subcategories', subcategory.value)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Content Types */}
              <FilterSection icon={BookOpen} title="Content Types">
                <div className="space-y-1">
                  {contentTypes.map(type => (
                    <FilterCheckbox
                      key={type.value}
                      label={type.label}
                      checked={(filters.contentTypes || []).includes(type.value)}
                      onChange={() => toggleArrayFilter('contentTypes', type.value)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Difficulty Levels */}
              <FilterSection icon={Target} title="Difficulty">
                <div className="space-y-1">
                  {difficultyLevels.map(level => (
                    <FilterCheckbox
                      key={level.value}
                      label={level.label}
                      checked={(filters.difficultyLevels || []).includes(level.value)}
                      onChange={() => toggleArrayFilter('difficultyLevels', level.value)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Tags */}
              {availableTags.length > 0 && (
                <FilterSection icon={Tag} title="Tags">
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {availableTags.slice(0, 20).map(tag => (
                      <FilterCheckbox
                        key={tag}
                        label={tag}
                        checked={(filters.tags || []).includes(tag)}
                        onChange={() => toggleArrayFilter('tags', tag)}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Read Time */}
              <FilterSection icon={Clock} title="Read Time">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <button
                      onClick={() => setReadTimeRange(undefined, 5)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.estimatedReadTime?.max === 5 && !filters.estimatedReadTime?.min
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Quick reads (≤ 5 min)
                    </button>
                    <button
                      onClick={() => setReadTimeRange(5, 15)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.estimatedReadTime?.min === 5 && filters.estimatedReadTime?.max === 15
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Medium reads (5-15 min)
                    </button>
                    <button
                      onClick={() => setReadTimeRange(15, undefined)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.estimatedReadTime?.min === 15 && !filters.estimatedReadTime?.max
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Long reads (15+ min)
                    </button>
                  </div>
                </div>
              </FilterSection>

              {/* Date Range - Simplified for this implementation */}
              <FilterSection icon={Calendar} title="Published">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const lastWeek = new Date();
                      lastWeek.setDate(lastWeek.getDate() - 7);
                      onUpdateFilters({
                        ...filters,
                        dateRange: { from: lastWeek, to: new Date() }
                      });
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => {
                      const lastMonth = new Date();
                      lastMonth.setDate(lastMonth.getDate() - 30);
                      onUpdateFilters({
                        ...filters,
                        dateRange: { from: lastMonth, to: new Date() }
                      });
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={() => {
                      const lastYear = new Date();
                      lastYear.setFullYear(lastYear.getFullYear() - 1);
                      onUpdateFilters({
                        ...filters,
                        dateRange: { from: lastYear, to: new Date() }
                      });
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Last year
                  </button>
                </div>
              </FilterSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}