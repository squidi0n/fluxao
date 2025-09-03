'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  Hash, 
  User, 
  Calendar,
  ArrowRight,
  Sparkles,
  Filter
} from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import { Input } from '../input';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchSuggestion {
  id: string;
  type: 'query' | 'tag' | 'author' | 'category' | 'recent' | 'trending';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  count?: number;
  trending?: boolean;
  recent?: boolean;
}

interface SearchWithSuggestionsProps {
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  recentSearches?: string[];
  onClearHistory?: () => void;
  isLoading?: boolean;
  searchHistory?: string[];
  trendingTopics?: string[];
}

// Mock data - in real app, this would come from API
const mockSuggestions: SearchSuggestion[] = [
  // Recent searches
  { id: 'r1', type: 'recent', title: 'React hooks tutorial', icon: Clock, recent: true },
  { id: 'r2', type: 'recent', title: 'TypeScript advanced patterns', icon: Clock, recent: true },
  { id: 'r3', type: 'recent', title: 'Next.js deployment', icon: Clock, recent: true },
  
  // Trending searches
  { id: 't1', type: 'trending', title: 'AI coding assistants', icon: TrendingUp, count: 1247, trending: true },
  { id: 't2', type: 'trending', title: 'React Server Components', icon: TrendingUp, count: 892, trending: true },
  { id: 't3', type: 'trending', title: 'Tailwind CSS tips', icon: TrendingUp, count: 756, trending: true },
  { id: 't4', type: 'trending', title: 'Docker best practices', icon: TrendingUp, count: 634, trending: true },
  
  // Categories
  { id: 'c1', type: 'category', title: 'Web Development', subtitle: '312 articles', icon: Filter, count: 312 },
  { id: 'c2', type: 'category', title: 'Mobile Development', subtitle: '189 articles', icon: Filter, count: 189 },
  { id: 'c3', type: 'category', title: 'Data Science', subtitle: '156 articles', icon: Filter, count: 156 },
  
  // Authors
  { id: 'a1', type: 'author', title: 'Sarah Chen', subtitle: '42 articles', icon: User, count: 42 },
  { id: 'a2', type: 'author', title: 'Mike Johnson', subtitle: '38 articles', icon: User, count: 38 },
  { id: 'a3', type: 'author', title: 'Alex Rivera', subtitle: '31 articles', icon: User, count: 31 },
  
  // Tags
  { id: 'tag1', type: 'tag', title: 'react', icon: Hash, count: 234 },
  { id: 'tag2', type: 'tag', title: 'javascript', icon: Hash, count: 456 },
  { id: 'tag3', type: 'tag', title: 'typescript', icon: Hash, count: 189 },
  { id: 'tag4', type: 'tag', title: 'nodejs', icon: Hash, count: 167 },
  { id: 'tag5', type: 'tag', title: 'python', icon: Hash, count: 198 },
  { id: 'tag6', type: 'tag', title: 'nextjs', icon: Hash, count: 145 },
];

const popularQueries = [
  'React hooks',
  'TypeScript',
  'Next.js',
  'Tailwind CSS',
  'Node.js',
  'Python',
  'Docker',
  'AWS',
  'GraphQL',
  'Vue.js',
  'Angular',
  'MongoDB'
];

export default function SearchWithSuggestions({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search articles, tags, authors...",
  className = '',
  recentSearches = [],
  onClearHistory,
  isLoading = false,
  searchHistory = [],
  trendingTopics = []
}: SearchWithSuggestionsProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  const filteredSuggestions = useMemo(() => {
    if (!debouncedQuery.trim()) {
      // Show recent searches and trending when no query
      return [
        ...mockSuggestions.filter(s => s.type === 'recent').slice(0, 3),
        ...mockSuggestions.filter(s => s.type === 'trending').slice(0, 4),
        ...mockSuggestions.filter(s => s.type === 'category').slice(0, 3)
      ];
    }

    // Filter suggestions based on query
    const queryLower = debouncedQuery.toLowerCase();
    return mockSuggestions.filter(suggestion =>
      suggestion.title.toLowerCase().includes(queryLower) ||
      suggestion.subtitle?.toLowerCase().includes(queryLower)
    ).slice(0, 8);
  }, [debouncedQuery]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    if (!isOpen) setIsOpen(true);
  }, [isOpen]);

  const handleSearch = useCallback((searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (queryToSearch.trim()) {
      onSearch(queryToSearch.trim());
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [query, onSearch]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query' || suggestion.type === 'recent' || suggestion.type === 'trending') {
      setQuery(suggestion.title);
      handleSearch(suggestion.title);
    } else {
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
    }
    setIsOpen(false);
  }, [handleSearch, onSuggestionSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, filteredSuggestions, selectedIndex, handleSearch, handleSuggestionClick]);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      suggestionsRef.current && 
      !suggestionsRef.current.contains(e.target as Node) &&
      !inputRef.current?.contains(e.target as Node)
    ) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const groupedSuggestions = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return [
        { 
          title: 'Recent Searches', 
          items: filteredSuggestions.filter(s => s.type === 'recent'),
          showClear: true
        },
        { 
          title: 'Trending Now', 
          items: filteredSuggestions.filter(s => s.type === 'trending') 
        },
        { 
          title: 'Browse Categories', 
          items: filteredSuggestions.filter(s => s.type === 'category') 
        }
      ].filter(group => group.items.length > 0);
    }

    // Group filtered results by type
    const groups = filteredSuggestions.reduce((acc, suggestion) => {
      const type = suggestion.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(suggestion);
      return acc;
    }, {} as Record<string, SearchSuggestion[]>);

    const typeLabels = {
      query: 'Suggestions',
      recent: 'Recent Searches',
      trending: 'Trending',
      category: 'Categories',
      author: 'Authors',
      tag: 'Tags'
    };

    return Object.entries(groups).map(([type, items]) => ({
      title: typeLabels[type as keyof typeof typeLabels] || type,
      items,
      showClear: type === 'recent'
    }));
  }, [filteredSuggestions, debouncedQuery]);

  const SuggestionItem = ({ 
    suggestion, 
    index, 
    isSelected 
  }: { 
    suggestion: SearchSuggestion; 
    index: number; 
    isSelected: boolean; 
  }) => {
    const Icon = suggestion.icon;
    
    return (
      <motion.button
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        onClick={() => handleSuggestionClick(suggestion)}
        className={cn(
          "w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-150",
          "hover:bg-gray-50 dark:hover:bg-gray-800",
          isSelected && "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
          suggestion.type === 'recent' ? "bg-gray-100 dark:bg-gray-700" :
          suggestion.type === 'trending' ? "bg-red-100 dark:bg-red-900/30" :
          suggestion.type === 'category' ? "bg-blue-100 dark:bg-blue-900/30" :
          suggestion.type === 'author' ? "bg-green-100 dark:bg-green-900/30" :
          suggestion.type === 'tag' ? "bg-purple-100 dark:bg-purple-900/30" :
          "bg-gray-100 dark:bg-gray-700"
        )}>
          <Icon className={cn(
            "w-4 h-4",
            suggestion.type === 'recent' ? "text-gray-600 dark:text-gray-400" :
            suggestion.type === 'trending' ? "text-red-600 dark:text-red-400" :
            suggestion.type === 'category' ? "text-blue-600 dark:text-blue-400" :
            suggestion.type === 'author' ? "text-green-600 dark:text-green-400" :
            suggestion.type === 'tag' ? "text-purple-600 dark:text-purple-400" :
            "text-gray-600 dark:text-gray-400"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {suggestion.title}
            </p>
            {suggestion.trending && (
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                Hot
              </Badge>
            )}
            {suggestion.recent && (
              <Badge variant="secondary" className="text-xs">
                Recent
              </Badge>
            )}
          </div>
          {suggestion.subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {suggestion.subtitle}
            </p>
          )}
        </div>
        
        {suggestion.count && (
          <Badge variant="secondary" className="text-xs">
            {suggestion.count.toLocaleString()}
          </Badge>
        )}
        
        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-11 pr-10 py-3 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-colors"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Popular Queries Pills */}
      {!isOpen && !query && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 flex flex-wrap gap-2"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Popular:</span>
          {popularQueries.slice(0, 6).map((popularQuery, index) => (
            <motion.button
              key={popularQuery}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => handleSearch(popularQuery)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {popularQuery}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto">
              {filteredSuggestions.length === 0 ? (
                <div className="p-6 text-center">
                  <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No results found for "{debouncedQuery}"
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Try a different search term or browse our categories
                  </p>
                </div>
              ) : (
                <div>
                  {groupedSuggestions.map((group, groupIndex) => (
                    <div key={group.title}>
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          {group.title}
                        </h4>
                        {group.showClear && onClearHistory && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearHistory}
                            className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {group.items.map((suggestion, itemIndex) => {
                        const globalIndex = groupedSuggestions
                          .slice(0, groupIndex)
                          .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                        
                        return (
                          <SuggestionItem
                            key={suggestion.id}
                            suggestion={suggestion}
                            index={globalIndex}
                            isSelected={selectedIndex === globalIndex}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search Footer */}
            {query.trim() && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                <Button
                  onClick={() => handleSearch()}
                  className="w-full justify-center text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Search for "{query}"
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}