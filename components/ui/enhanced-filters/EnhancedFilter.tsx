'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  X, 
  Settings, 
  Share2,
  Download,
  Bookmark,
  History,
  Menu,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import { cn } from '@/lib/utils';

// Import all our components
import FilterSidebar, { FilterState } from './FilterSidebar';
import FilterModal from './FilterModal';
import QuickFilters from './QuickFilters';
import SearchWithSuggestions from './SearchWithSuggestions';
import FilterPill from './FilterPill';
import FilterSkeleton from './FilterSkeleton';
import FilterHistory from './FilterHistory';
import { useFilterUrl, filterUtils } from './useFilterUrl';

interface EnhancedFilterProps {
  // Data props
  onFiltersChange?: (filters: FilterState) => void;
  onSearch?: (query: string) => void;
  availableOptions?: {
    categories?: string[];
    subcategories?: string[];
    contentTypes?: string[];
    difficultyLevels?: string[];
    tags?: string[];
  };
  
  // Display props
  layout?: 'sidebar' | 'top' | 'modal-only';
  showQuickFilters?: boolean;
  showSearchSuggestions?: boolean;
  showFilterHistory?: boolean;
  showActiveFilters?: boolean;
  
  // State props
  isLoading?: boolean;
  resultCount?: number;
  initialFilters?: FilterState;
  
  // Behavior props
  persistToUrl?: boolean;
  enableSharing?: boolean;
  enableExport?: boolean;
  
  // Styling props
  className?: string;
  sidebarClassName?: string;
  
  // Callbacks
  onShare?: (url: string) => void;
  onExport?: (filters: FilterState) => void;
  onSavePreset?: (name: string, filters: FilterState) => void;
}

const defaultOptions = {
  categories: ['Technology', 'Programming', 'Web Development', 'AI & ML', 'DevOps', 'Mobile', 'Design'],
  subcategories: ['Frontend', 'Backend', 'Full Stack', 'Data Science', 'Security', 'Cloud'],
  contentTypes: ['Tutorial', 'Article', 'News', 'Opinion', 'Review', 'Guide'],
  difficultyLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  tags: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Next.js'],
};

export default function EnhancedFilter({
  onFiltersChange,
  onSearch,
  availableOptions = defaultOptions,
  layout = 'top',
  showQuickFilters = true,
  showSearchSuggestions = true,
  showFilterHistory = false,
  showActiveFilters = true,
  isLoading = false,
  resultCount,
  initialFilters = {},
  persistToUrl = true,
  enableSharing = false,
  enableExport = false,
  className = '',
  sidebarClassName = '',
  onShare,
  onExport,
  onSavePreset
}: EnhancedFilterProps) {
  
  // URL persistence hook
  const {
    filters,
    updateFilters,
    clearFilters,
    getShareableUrl,
    getFilterCount,
    isEmpty
  } = useFilterUrl(initialFilters, { replaceHistory: true });

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [currentView, setCurrentView] = useState<'filters' | 'search' | 'history'>('filters');

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    updateFilters(prev => ({ ...prev, searchQuery: query }));
    if (onSearch) onSearch(query);
  }, [updateFilters, onSearch]);

  // Handle filter application
  const handleApplyFilters = useCallback((newFilters: FilterState) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle sharing
  const handleShare = useCallback(() => {
    const url = getShareableUrl();
    if (onShare) {
      onShare(url);
    } else {
      // Fallback to clipboard
      navigator.clipboard?.writeText(url);
    }
  }, [getShareableUrl, onShare]);

  // Handle export
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(filters);
    } else {
      // Fallback to download JSON
      const dataStr = JSON.stringify(filters, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'filter-preset.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  }, [filters, onExport]);

  // Active filter count for badges
  const activeFilterCount = getFilterCount();
  const hasActiveFilters = !isEmpty();

  // Top toolbar
  const Toolbar = () => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        {layout === 'sidebar' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        
        {/* Filter button for modal-only layout */}
        {layout === 'modal-only' && (
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
        
        {/* Results count */}
        {resultCount !== undefined && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? (
              <FilterSkeleton variant="pills" count={1} className="w-20 h-4" />
            ) : (
              <span>{resultCount.toLocaleString()} results</span>
            )}
            {hasActiveFilters && (
              <span className="text-blue-600 dark:text-blue-400">
                • {filterUtils.getSummary(filters)}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* View toggle */}
        <div className="hidden md:flex items-center space-x-1">
          {['filters', 'search', 'history'].map((view) => (
            <Button
              key={view}
              variant={currentView === view ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView(view as any)}
              className="capitalize"
            >
              {view === 'filters' && <Filter className="w-4 h-4 mr-1" />}
              {view === 'search' && <Search className="w-4 h-4 mr-1" />}
              {view === 'history' && <History className="w-4 h-4 mr-1" />}
              {view}
            </Button>
          ))}
        </div>
        
        {/* Action buttons */}
        {enableSharing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            disabled={isEmpty()}
            title="Share filters"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        )}
        
        {enableExport && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            disabled={isEmpty()}
            title="Export filters"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
        
        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );

  // Main content renderer
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-6">
          <FilterSkeleton 
            variant={currentView === 'search' ? 'search' : currentView === 'history' ? 'pills' : 'cards'} 
            count={currentView === 'filters' ? 8 : 6}
          />
        </div>
      );
    }

    switch (currentView) {
      case 'search':
        return showSearchSuggestions ? (
          <div className="p-6">
            <SearchWithSuggestions
              onSearch={handleSearch}
              placeholder="Search articles, authors, tags..."
              isLoading={isLoading}
            />
          </div>
        ) : null;
        
      case 'history':
        return showFilterHistory ? (
          <div className="p-6">
            <FilterHistory
              onApplyFilter={handleApplyFilters}
              onSavePreset={onSavePreset}
            />
          </div>
        ) : null;
        
      default:
        return showQuickFilters ? (
          <div className="p-6">
            <QuickFilters
              onApplyFilter={handleApplyFilters}
              currentFilters={filters}
              onClearFilters={clearFilters}
            />
          </div>
        ) : null;
    }
  };

  if (layout === 'sidebar') {
    return (
      <div className={cn("flex h-screen", className)}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            onUpdateFilters={updateFilters}
            onClearAll={clearFilters}
            availableOptions={availableOptions}
            className={sidebarClassName}
          />
        </div>
        
        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div 
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsSidebarOpen(false)}
              />
              <FilterSidebar
                filters={filters}
                onUpdateFilters={updateFilters}
                onClearAll={clearFilters}
                availableOptions={availableOptions}
                onClose={() => setIsSidebarOpen(false)}
                className="relative z-10 w-80"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Toolbar />
          {showActiveFilters && hasActiveFilters && (
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {filters.searchQuery && (
                    <FilterPill
                      key="search"
                      label="Search"
                      value={filters.searchQuery}
                      variant="active"
                      removable
                      onRemove={() => updateFilters(prev => ({ ...prev, searchQuery: undefined }))}
                    />
                  )}
                  {filters.categories?.map(category => (
                    <FilterPill
                      key={`cat-${category}`}
                      label="Category"
                      value={category}
                      variant="active"
                      removable
                      onRemove={() => updateFilters(prev => ({
                        ...prev,
                        categories: prev.categories?.filter(c => c !== category)
                      }))}
                    />
                  ))}
                  {filters.tags?.map(tag => (
                    <FilterPill
                      key={`tag-${tag}`}
                      label="Tag"
                      value={tag}
                      variant="active"
                      removable
                      onRemove={() => updateFilters(prev => ({
                        ...prev,
                        tags: prev.tags?.filter(t => t !== tag)
                      }))}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'modal-only') {
    return (
      <div className={className}>
        <Toolbar />
        <FilterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          filters={filters}
          onUpdateFilters={updateFilters}
          onClearAll={clearFilters}
          availableOptions={availableOptions}
        />
      </div>
    );
  }

  // Default: top layout
  return (
    <div className={cn("w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg", className)}>
      <Toolbar />
      
      {/* Active Filters Bar */}
      {showActiveFilters && hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Filters ({activeFilterCount})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                if (Array.isArray(value)) {
                  return value.map(item => (
                    <FilterPill
                      key={`${key}-${item}`}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={item}
                      variant="active"
                      removable
                      onRemove={() => updateFilters(prev => ({
                        ...prev,
                        [key]: (prev[key as keyof FilterState] as string[])?.filter(v => v !== item)
                      }))}
                    />
                  ));
                }
                
                if (typeof value === 'boolean' && value) {
                  return (
                    <FilterPill
                      key={key}
                      label=""
                      value={key.charAt(0).toUpperCase() + key.slice(1)}
                      variant="active"
                      removable
                      onRemove={() => updateFilters(prev => ({ ...prev, [key]: undefined }))}
                    />
                  );
                }
                
                if (typeof value === 'string') {
                  return (
                    <FilterPill
                      key={key}
                      label={key === 'searchQuery' ? 'Search' : key.charAt(0).toUpperCase() + key.slice(1)}
                      value={value}
                      variant="active"
                      removable
                      onRemove={() => updateFilters(prev => ({ ...prev, [key]: undefined }))}
                    />
                  );
                }
                
                return null;
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}