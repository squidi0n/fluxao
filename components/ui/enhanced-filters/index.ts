// Main component
export { default as EnhancedFilter } from './EnhancedFilter';

// Individual components
export { default as FilterSidebar } from './FilterSidebar';
export { default as FilterModal } from './FilterModal';
export { default as QuickFilters } from './QuickFilters';
export { default as SearchWithSuggestions } from './SearchWithSuggestions';
export { default as FilterPill } from './FilterPill';
export { default as FilterSkeleton } from './FilterSkeleton';
export { default as FilterHistory } from './FilterHistory';

// Hooks and utilities
export { useFilterUrl, filterUtils } from './useFilterUrl';

// Types
export type { FilterState } from './FilterSidebar';

// Re-export commonly used types for convenience
export interface FilterOptions {
  categories?: string[];
  subcategories?: string[];
  contentTypes?: string[];
  difficultyLevels?: string[];
  tags?: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
  icon?: string;
  color?: string;
}