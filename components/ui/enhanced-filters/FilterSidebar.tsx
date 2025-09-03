'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  X, 
  Calendar,
  Clock,
  Tag,
  BookOpen,
  Layers,
  Target,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import { Separator } from '../separator';
import { Slider } from '../slider';
import { Switch } from '../switch';
import { cn } from '@/lib/utils';

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
  isPremium?: boolean;
  isPopular?: boolean;
  hasVideo?: boolean;
}

interface FilterSection {
  id: string;
  title: string;
  icon: React.ElementType;
  defaultExpanded?: boolean;
}

interface FilterSidebarProps {
  filters: FilterState;
  onUpdateFilters: (filters: FilterState) => void;
  onClearAll?: () => void;
  availableOptions?: {
    categories?: string[];
    subcategories?: string[];
    contentTypes?: string[];
    difficultyLevels?: string[];
    tags?: string[];
  };
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const filterSections: FilterSection[] = [
  { id: 'categories', title: 'Categories', icon: Layers, defaultExpanded: true },
  { id: 'subcategories', title: 'Subcategories', icon: BookOpen },
  { id: 'contentTypes', title: 'Content Types', icon: Target },
  { id: 'difficulty', title: 'Difficulty Level', icon: Sparkles },
  { id: 'tags', title: 'Tags', icon: Tag },
  { id: 'dateRange', title: 'Date Range', icon: Calendar },
  { id: 'readTime', title: 'Reading Time', icon: Clock },
];

const defaultOptions = {
  categories: ['Technology', 'Programming', 'Web Development', 'AI & ML', 'DevOps', 'Mobile', 'Design'],
  subcategories: ['Frontend', 'Backend', 'Full Stack', 'Data Science', 'Security', 'Cloud'],
  contentTypes: ['Tutorial', 'Article', 'News', 'Opinion', 'Review', 'Guide'],
  difficultyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  tags: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Next.js'],
};

export default function FilterSidebar({
  filters,
  onUpdateFilters,
  onClearAll,
  availableOptions = defaultOptions,
  className = '',
  isOpen = true,
  onClose
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(filterSections.filter(s => s.defaultExpanded).map(s => s.id))
  );
  const [readTimeRange, setReadTimeRange] = useState<[number, number]>([
    filters.estimatedReadTime?.min || 1,
    filters.estimatedReadTime?.max || 30
  ]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const updateArrayFilter = useCallback((
    key: keyof FilterState,
    value: string,
    checked: boolean
  ) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    onUpdateFilters({
      ...filters,
      [key]: newArray.length > 0 ? newArray : undefined
    });
  }, [filters, onUpdateFilters]);

  const updateBooleanFilter = useCallback((key: keyof FilterState, value: boolean) => {
    onUpdateFilters({
      ...filters,
      [key]: value || undefined
    });
  }, [filters, onUpdateFilters]);

  const updateReadTimeRange = useCallback((range: [number, number]) => {
    setReadTimeRange(range);
    onUpdateFilters({
      ...filters,
      estimatedReadTime: {
        min: range[0],
        max: range[1]
      }
    });
  }, [filters, onUpdateFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).reduce((count, value) => {
      if (Array.isArray(value)) return count + value.length;
      if (typeof value === 'object' && value !== null) return count + 1;
      if (typeof value === 'boolean' && value) return count + 1;
      if (typeof value === 'string' && value) return count + 1;
      return count;
    }, 0);
  }, [filters]);

  const sectionVariants = {
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        height: { duration: 0.3, ease: 'easeOut' },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    },
    collapsed: { 
      height: 0, 
      opacity: 0,
      transition: { 
        height: { duration: 0.3, ease: 'easeIn' },
        opacity: { duration: 0.2 }
      }
    }
  };

  const chipVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    hover: { scale: 1.05 }
  };

  const FilterCheckbox = ({ 
    label, 
    checked, 
    onChange, 
    count 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    count?: number;
  }) => (
    <motion.label
      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group transition-colors"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200",
            checked 
              ? "bg-blue-500 border-blue-500 text-white" 
              : "border-gray-300 dark:border-gray-600 group-hover:border-blue-400"
          )}>
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-2 h-2 bg-white rounded-sm"
              />
            )}
          </div>
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
          {label}
        </span>
      </div>
      {count !== undefined && (
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      )}
    </motion.label>
  );

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h2>
              {activeFiltersCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onClearAll && activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Filters
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Premium Only</span>
            <Switch
              checked={filters.isPremium || false}
              onCheckedChange={(checked) => updateBooleanFilter('isPremium', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Popular Posts</span>
            <Switch
              checked={filters.isPopular || false}
              onCheckedChange={(checked) => updateBooleanFilter('isPopular', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Has Video</span>
            <Switch
              checked={filters.hasVideo || false}
              onCheckedChange={(checked) => updateBooleanFilter('hasVideo', checked)}
            />
          </div>
        </div>
      </div>

      {/* Filter Sections */}
      <div className="flex-1 overflow-y-auto">
        {filterSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <div key={section.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {section.title}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={sectionVariants}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-1">
                      {/* Categories */}
                      {section.id === 'categories' && availableOptions.categories?.map((category) => (
                        <FilterCheckbox
                          key={category}
                          label={category}
                          checked={filters.categories?.includes(category) || false}
                          onChange={(checked) => updateArrayFilter('categories', category, checked)}
                          count={Math.floor(Math.random() * 50) + 1}
                        />
                      ))}
                      
                      {/* Subcategories */}
                      {section.id === 'subcategories' && availableOptions.subcategories?.map((subcategory) => (
                        <FilterCheckbox
                          key={subcategory}
                          label={subcategory}
                          checked={filters.subcategories?.includes(subcategory) || false}
                          onChange={(checked) => updateArrayFilter('subcategories', subcategory, checked)}
                          count={Math.floor(Math.random() * 30) + 1}
                        />
                      ))}
                      
                      {/* Content Types */}
                      {section.id === 'contentTypes' && availableOptions.contentTypes?.map((type) => (
                        <FilterCheckbox
                          key={type}
                          label={type}
                          checked={filters.contentTypes?.includes(type) || false}
                          onChange={(checked) => updateArrayFilter('contentTypes', type, checked)}
                          count={Math.floor(Math.random() * 100) + 1}
                        />
                      ))}
                      
                      {/* Difficulty */}
                      {section.id === 'difficulty' && availableOptions.difficultyLevels?.map((level) => (
                        <FilterCheckbox
                          key={level}
                          label={level}
                          checked={filters.difficultyLevels?.includes(level) || false}
                          onChange={(checked) => updateArrayFilter('difficultyLevels', level, checked)}
                          count={Math.floor(Math.random() * 40) + 1}
                        />
                      ))}
                      
                      {/* Tags */}
                      {section.id === 'tags' && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {availableOptions.tags?.slice(0, 8).map((tag) => (
                              <motion.button
                                key={tag}
                                variants={chipVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                whileHover="hover"
                                onClick={() => updateArrayFilter('tags', tag, !filters.tags?.includes(tag))}
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                                  filters.tags?.includes(tag)
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                )}
                              >
                                {tag}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Reading Time */}
                      {section.id === 'readTime' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                              Reading Time: {readTimeRange[0]} - {readTimeRange[1]} minutes
                            </label>
                            <Slider
                              value={readTimeRange}
                              onValueChange={updateReadTimeRange}
                              min={1}
                              max={60}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}