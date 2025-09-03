'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Grid, List, SlidersHorizontal } from 'lucide-react';
import MultiFilterBar from '@/components/filters/MultiFilterBar';
import ActiveFilters, { FilterState } from '@/components/filters/ActiveFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import PostCard from '@/components/home/PostCard';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  contentType: 'TUTORIAL' | 'NEWS' | 'OPINION' | 'INTERVIEW' | 'REVIEW' | 'DEEP_DIVE';
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  subcategory?: string;
  estimatedReadTime?: number;
  publishedAt: string;
  viewCount: number;
  fluxCount: number;
  author: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  commentsCount: number;
  votesCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'publishedAt' | 'viewCount' | 'fluxCount'>('publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchPosts = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/posts/filtered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filters,
          page,
          limit: pagination.limit,
          sortBy,
          sortOrder,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, sortBy, sortOrder]);

  const fetchMetadata = useCallback(async () => {
    try {
      // Fetch categories
      const categoriesResponse = await fetch('/api/admin/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setAvailableCategories(categoriesData.map((cat: any) => cat.slug));
      }

      // Fetch tags
      const tagsResponse = await fetch('/api/posts/tags?includeCount=true&limit=100');
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setAvailableTags(tagsData.tags.map((tag: any) => tag.slug));
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handlePageChange = (page: number) => {
    fetchPosts(page);
  };

  const handleSaveFilters = (name: string, isDefault?: boolean) => {
    // This will be handled by the SavedFilters component
    console.log('Filters saved:', name, isDefault);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center items-center gap-3 mb-6">
              <BookOpen className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">
                FluxAO Blog
              </h1>
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Entdecke die neuesten Artikel, Tutorials und Insights zu KI, Technologie und digitaler Zukunft. 
              Nutze unsere fortschrittlichen Filter, um genau das zu finden, was dich interessiert.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Saved Filters */}
            <SavedFilters
              currentFilters={filters}
              onApplyFilters={handleFilterChange}
              onSaveFilters={handleSaveFilters}
            />

            {/* View Options */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                View Options
              </h3>
              <div className="space-y-3">
                {/* View Mode */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                    Layout
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Grid className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <List className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="publishedAt">Published Date</option>
                    <option value="viewCount">Views</option>
                    <option value="fluxCount">Flux Score</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filter Bar */}
            <MultiFilterBar
              filters={filters}
              onUpdateFilters={handleFilterChange}
              availableCategories={availableCategories}
              availableTags={availableTags}
            />

            {/* Active Filters */}
            <ActiveFilters
              filters={filters}
              onUpdateFilters={handleFilterChange}
              onClearAll={handleClearFilters}
            />

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? (
                  'Loading...'
                ) : (
                  `${pagination.totalCount} article${pagination.totalCount !== 1 ? 's' : ''} found`
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
            </div>

            {/* Posts Grid/List */}
            {error ? (
              <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 mb-4">
                  Error loading posts: {error}
                </div>
                <Button onClick={() => fetchPosts(1)}>Try Again</Button>
              </div>
            ) : loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your filters to see more results.
                </p>
                <Button onClick={handleClearFilters}>Clear All Filters</Button>
              </div>
            ) : (
              <motion.div
                layout
                className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
              >
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PostCard 
                      post={{
                        id: post.id,
                        slug: post.slug,
                        title: post.title,
                        excerpt: post.excerpt,
                        coverUrl: post.coverImage,
                        publishedAt: post.publishedAt,
                        author: {
                          name: post.author.name,
                          avatarUrl: post.author.avatar
                        },
                        category: post.categories[0] || null,
                        // Additional fields for enhanced display
                        subcategory: post.subcategory,
                        contentType: post.contentType,
                        difficultyLevel: post.difficultyLevel,
                        estimatedReadTime: post.estimatedReadTime,
                        tags: post.tags
                      }} 
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {!loading && posts.length > 0 && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = i + 1;
                    } else if (pagination.page <= 3) {
                      page = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + i;
                    } else {
                      page = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={page}
                        variant={page === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}