'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkPlus, Trash2, Star } from 'lucide-react';
import FilterChip from './FilterChip';
import { FilterState } from './ActiveFilters';
import { useSession } from 'next-auth/react';

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  isDefault: boolean;
  createdAt: string;
}

interface SavedFiltersProps {
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onSaveFilters?: (name: string, isDefault?: boolean) => void;
  className?: string;
}

export default function SavedFilters({
  currentFilters,
  onApplyFilters,
  onSaveFilters,
  className = ''
}: SavedFiltersProps) {
  const { data: session } = useSession();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Load saved filters on component mount
  useEffect(() => {
    if (session?.user) {
      loadSavedFilters();
    }
  }, [session]);

  const loadSavedFilters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/filters/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedFilters(data);
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFilters = async () => {
    if (!filterName.trim() || !session?.user) return;

    try {
      const response = await fetch('/api/filters/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: filterName.trim(),
          filters: currentFilters,
          isDefault,
        }),
      });

      if (response.ok) {
        const savedFilter = await response.json();
        setSavedFilters(prev => [...prev, savedFilter]);
        setFilterName('');
        setIsDefault(false);
        setShowSaveDialog(false);
        
        if (onSaveFilters) {
          onSaveFilters(filterName.trim(), isDefault);
        }
      }
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  };

  const deleteFilter = async (filterId: string) => {
    try {
      const response = await fetch(`/api/filters/saved/${filterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedFilters(prev => prev.filter(f => f.id !== filterId));
      }
    } catch (error) {
      console.error('Failed to delete filter:', error);
    }
  };

  const setAsDefault = async (filterId: string) => {
    try {
      const response = await fetch(`/api/filters/saved/${filterId}/default`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSavedFilters(prev => prev.map(f => ({
          ...f,
          isDefault: f.id === filterId
        })));
      }
    } catch (error) {
      console.error('Failed to set default filter:', error);
    }
  };

  const hasCurrentFilters = Object.values(currentFilters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return Boolean(value);
  });

  if (!session?.user) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            Saved Filters ({savedFilters.length})
          </button>
          
          {hasCurrentFilters && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-md transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save Current
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isLoading ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Loading saved filters...
                </div>
              ) : savedFilters.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No saved filters yet
                </div>
              ) : (
                <div className="space-y-2">
                  {savedFilters.map((filter) => (
                    <motion.div
                      key={filter.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {filter.isDefault && (
                          <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {filter.name}
                            </span>
                            {filter.isDefault && (
                              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(filter.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onApplyFilters(filter.filters)}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Apply
                        </button>
                        {!filter.isDefault && (
                          <button
                            onClick={() => setAsDefault(filter.id)}
                            className="px-2 py-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                            title="Set as default"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteFilter(filter.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Save Filter Combination
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Name
                  </label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="e.g., AI Tutorials - Beginner"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Set as default filter
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFilters}
                  disabled={!filterName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  Save Filter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}