'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FilterState } from './FilterSidebar';

interface UseFilterUrlOptions {
  debounceMs?: number;
  replaceHistory?: boolean;
}

export function useFilterUrl(
  initialFilters: FilterState = {},
  options: UseFilterUrlOptions = {}
) {
  const { debounceMs = 500, replaceHistory = false } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<FilterState>(() => {
    // Parse filters from URL on initial load
    return parseFiltersFromUrl(searchParams) || initialFilters;
  });
  
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Parse filters from URL search params
  const parseFiltersFromUrl = useCallback((params: URLSearchParams): FilterState => {
    const filters: FilterState = {};
    
    // Parse array parameters
    const categories = params.get('categories');
    if (categories) {
      filters.categories = categories.split(',').filter(Boolean);
    }
    
    const subcategories = params.get('subcategories');
    if (subcategories) {
      filters.subcategories = subcategories.split(',').filter(Boolean);
    }
    
    const contentTypes = params.get('contentTypes');
    if (contentTypes) {
      filters.contentTypes = contentTypes.split(',').filter(Boolean);
    }
    
    const difficultyLevels = params.get('difficulty');
    if (difficultyLevels) {
      filters.difficultyLevels = difficultyLevels.split(',').filter(Boolean);
    }
    
    const tags = params.get('tags');
    if (tags) {
      filters.tags = tags.split(',').filter(Boolean);
    }
    
    // Parse search query
    const searchQuery = params.get('q');
    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }
    
    // Parse boolean parameters
    const isPremium = params.get('premium');
    if (isPremium === 'true') {
      filters.isPremium = true;
    }
    
    const isPopular = params.get('popular');
    if (isPopular === 'true') {
      filters.isPopular = true;
    }
    
    const hasVideo = params.get('video');
    if (hasVideo === 'true') {
      filters.hasVideo = true;
    }
    
    // Parse date range
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');
    if (dateFrom || dateTo) {
      filters.dateRange = {};
      if (dateFrom) {
        filters.dateRange.from = new Date(dateFrom);
      }
      if (dateTo) {
        filters.dateRange.to = new Date(dateTo);
      }
    }
    
    // Parse read time range
    const readTimeMin = params.get('readTimeMin');
    const readTimeMax = params.get('readTimeMax');
    if (readTimeMin || readTimeMax) {
      filters.estimatedReadTime = {};
      if (readTimeMin) {
        filters.estimatedReadTime.min = parseInt(readTimeMin, 10);
      }
      if (readTimeMax) {
        filters.estimatedReadTime.max = parseInt(readTimeMax, 10);
      }
    }
    
    return filters;
  }, []);

  // Convert filters to URL search params
  const filtersToSearchParams = useCallback((filters: FilterState): URLSearchParams => {
    const params = new URLSearchParams();
    
    // Add array parameters
    if (filters.categories?.length) {
      params.set('categories', filters.categories.join(','));
    }
    
    if (filters.subcategories?.length) {
      params.set('subcategories', filters.subcategories.join(','));
    }
    
    if (filters.contentTypes?.length) {
      params.set('contentTypes', filters.contentTypes.join(','));
    }
    
    if (filters.difficultyLevels?.length) {
      params.set('difficulty', filters.difficultyLevels.join(','));
    }
    
    if (filters.tags?.length) {
      params.set('tags', filters.tags.join(','));
    }
    
    // Add search query
    if (filters.searchQuery) {
      params.set('q', filters.searchQuery);
    }
    
    // Add boolean parameters
    if (filters.isPremium) {
      params.set('premium', 'true');
    }
    
    if (filters.isPopular) {
      params.set('popular', 'true');
    }
    
    if (filters.hasVideo) {
      params.set('video', 'true');
    }
    
    // Add date range
    if (filters.dateRange?.from) {
      params.set('dateFrom', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange?.to) {
      params.set('dateTo', filters.dateRange.to.toISOString());
    }
    
    // Add read time range
    if (filters.estimatedReadTime?.min) {
      params.set('readTimeMin', filters.estimatedReadTime.min.toString());
    }
    if (filters.estimatedReadTime?.max) {
      params.set('readTimeMax', filters.estimatedReadTime.max.toString());
    }
    
    return params;
  }, []);

  // Update URL with current filters
  const updateUrl = useCallback((newFilters: FilterState) => {
    const params = filtersToSearchParams(newFilters);
    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    
    if (replaceHistory) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url, { scroll: false });
    }
  }, [filtersToSearchParams, pathname, router, replaceHistory]);

  // Update filters and URL
  const updateFilters = useCallback((newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
    setFilters(prevFilters => {
      const updatedFilters = typeof newFilters === 'function' 
        ? newFilters(prevFilters) 
        : newFilters;
      
      // Clear existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Set new timeout for URL update
      const timeout = setTimeout(() => {
        updateUrl(updatedFilters);
      }, debounceMs);
      
      setDebounceTimeout(timeout);
      
      return updatedFilters;
    });
  }, [debounceTimeout, debounceMs, updateUrl]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // Get shareable URL
  const getShareableUrl = useCallback((customFilters?: FilterState): string => {
    const filtersToUse = customFilters || filters;
    const params = filtersToSearchParams(filtersToUse);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return params.toString() 
      ? `${baseUrl}${pathname}?${params.toString()}`
      : `${baseUrl}${pathname}`;
  }, [filters, filtersToSearchParams, pathname]);

  // Get filter count
  const getFilterCount = useCallback((filtersToCount?: FilterState): number => {
    const filtersToUse = filtersToCount || filters;
    return Object.values(filtersToUse).reduce((count, value) => {
      if (Array.isArray(value)) return count + value.length;
      if (typeof value === 'object' && value !== null) return count + 1;
      if (typeof value === 'boolean' && value) return count + 1;
      if (typeof value === 'string' && value) return count + 1;
      return count;
    }, 0);
  }, [filters]);

  // Check if filters are empty
  const isEmpty = useCallback((filtersToCheck?: FilterState): boolean => {
    return getFilterCount(filtersToCheck) === 0;
  }, [getFilterCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newFilters = parseFiltersFromUrl(new URLSearchParams(window.location.search));
      setFilters(newFilters);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseFiltersFromUrl]);

  return {
    filters,
    updateFilters,
    clearFilters,
    getShareableUrl,
    getFilterCount: () => getFilterCount(),
    isEmpty: () => isEmpty(),
    parseFiltersFromUrl
  };
}

// Utility functions for filter comparison and validation
export const filterUtils = {
  // Compare two filter states
  isEqual: (filters1: FilterState, filters2: FilterState): boolean => {
    return JSON.stringify(filters1) === JSON.stringify(filters2);
  },

  // Merge two filter states
  merge: (base: FilterState, overlay: FilterState): FilterState => {
    const merged: FilterState = { ...base };
    
    Object.entries(overlay).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          merged[key as keyof FilterState] = value as any;
        } else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
          merged[key as keyof FilterState] = value as any;
        } else if (typeof value === 'boolean' || typeof value === 'string') {
          merged[key as keyof FilterState] = value as any;
        }
      }
    });
    
    return merged;
  },

  // Extract filter keys that have values
  getActiveKeys: (filters: FilterState): string[] => {
    return Object.entries(filters)
      .filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
        return Boolean(value);
      })
      .map(([key]) => key);
  },

  // Generate filter summary text
  getSummary: (filters: FilterState): string => {
    const parts: string[] = [];
    
    if (filters.searchQuery) {
      parts.push(`"${filters.searchQuery}"`);
    }
    
    if (filters.categories?.length) {
      parts.push(`${filters.categories.length} categories`);
    }
    
    if (filters.tags?.length) {
      parts.push(`${filters.tags.length} tags`);
    }
    
    if (filters.difficultyLevels?.length) {
      parts.push(`${filters.difficultyLevels[0]} level`);
    }
    
    const features: string[] = [];
    if (filters.isPremium) features.push('Premium');
    if (filters.isPopular) features.push('Popular');
    if (filters.hasVideo) features.push('Video');
    
    if (features.length > 0) {
      parts.push(features.join(', '));
    }
    
    if (filters.estimatedReadTime) {
      const { min, max } = filters.estimatedReadTime;
      if (min && max) {
        parts.push(`${min}-${max} min read`);
      } else if (min) {
        parts.push(`${min}+ min read`);
      } else if (max) {
        parts.push(`≤${max} min read`);
      }
    }
    
    return parts.join(' • ') || 'All content';
  }
};