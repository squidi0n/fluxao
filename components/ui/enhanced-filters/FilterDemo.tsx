'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Layout, 
  Smartphone, 
  Monitor,
  Sparkles,
  Share2,
  Download
} from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import { Card } from '../Card';
import { cn } from '@/lib/utils';

import EnhancedFilter from './EnhancedFilter';
import { FilterState } from './FilterSidebar';

interface DemoLayoutOption {
  id: 'sidebar' | 'top' | 'modal-only';
  name: string;
  icon: React.ElementType;
  description: string;
}

const layoutOptions: DemoLayoutOption[] = [
  {
    id: 'sidebar',
    name: 'Sidebar Layout',
    icon: Layout,
    description: 'Classic sidebar with collapsible sections'
  },
  {
    id: 'top',
    name: 'Top Layout',
    icon: Monitor,
    description: 'Horizontal layout with tabbed interface'
  },
  {
    id: 'modal-only',
    name: 'Mobile Modal',
    icon: Smartphone,
    description: 'Mobile-first modal-based filtering'
  }
];

// Mock blog data for demonstration
const mockArticles = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: [
    'Getting Started with React Hooks',
    'Advanced TypeScript Patterns',
    'Building Scalable Node.js Applications',
    'CSS Grid vs Flexbox: Complete Guide',
    'Modern JavaScript ES2024 Features',
    'Vue.js 3 Composition API Deep Dive',
    'Docker for Frontend Developers',
    'GraphQL Best Practices',
    'Next.js App Router Migration Guide',
    'Python Machine Learning Basics'
  ][i % 10],
  category: ['Web Development', 'Programming', 'DevOps', 'AI & ML', 'Mobile'][i % 5],
  tags: [
    ['react', 'hooks', 'javascript'],
    ['typescript', 'patterns', 'advanced'],
    ['nodejs', 'scalability', 'backend'],
    ['css', 'grid', 'flexbox'],
    ['javascript', 'es2024', 'modern']
  ][i % 5],
  difficulty: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
  contentType: ['Tutorial', 'Article', 'Guide'][i % 3],
  readTime: Math.floor(Math.random() * 20) + 3,
  isPremium: Math.random() > 0.7,
  hasVideo: Math.random() > 0.6,
  isPopular: Math.random() > 0.8,
  publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
}));

export default function FilterDemo() {
  const [selectedLayout, setSelectedLayout] = useState<'sidebar' | 'top' | 'modal-only'>('top');
  const [currentFilters, setCurrentFilters] = useState<FilterState>({});
  const [filteredResults, setFilteredResults] = useState(mockArticles);

  // Mock filter function
  const applyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
    
    let results = mockArticles.filter(article => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!article.title.toLowerCase().includes(query) && 
            !article.tags.some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }
      
      // Categories
      if (filters.categories?.length && !filters.categories.includes(article.category)) {
        return false;
      }
      
      // Tags
      if (filters.tags?.length && !filters.tags.some(tag => article.tags.includes(tag))) {
        return false;
      }
      
      // Difficulty
      if (filters.difficultyLevels?.length && !filters.difficultyLevels.includes(article.difficulty)) {
        return false;
      }
      
      // Content type
      if (filters.contentTypes?.length && !filters.contentTypes.includes(article.contentType)) {
        return false;
      }
      
      // Read time
      if (filters.estimatedReadTime) {
        const { min, max } = filters.estimatedReadTime;
        if (min && article.readTime < min) return false;
        if (max && article.readTime > max) return false;
      }
      
      // Premium
      if (filters.isPremium && !article.isPremium) {
        return false;
      }
      
      // Popular
      if (filters.isPopular && !article.isPopular) {
        return false;
      }
      
      // Video
      if (filters.hasVideo && !article.hasVideo) {
        return false;
      }
      
      return true;
    });
    
    setFilteredResults(results);
  };

  const handleShare = (url: string) => {
    navigator.clipboard?.writeText(url);
    // In a real app, you'd show a toast notification
    console.log('Filter URL copied to clipboard:', url);
  };

  const handleExport = (filters: FilterState) => {
    console.log('Exporting filters:', filters);
    // Implementation for filter export
  };

  const handleSavePreset = (name: string, filters: FilterState) => {
    console.log('Saving preset:', name, filters);
    // Implementation for saving presets
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Enhanced Filter System Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Beautiful and intuitive filtering with animations, URL persistence, and mobile support
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Interactive Demo
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Selector */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Choose Layout Style
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layoutOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => setSelectedLayout(option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all duration-200",
                    selectedLayout === option.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedLayout === option.id
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        selectedLayout === option.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      )} />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {option.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </Card>

        {/* Filter Component */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className={cn(
            selectedLayout === 'sidebar' ? "xl:col-span-4" : "xl:col-span-4"
          )}>
            <EnhancedFilter
              layout={selectedLayout}
              onFiltersChange={applyFilters}
              onSearch={(query) => applyFilters({ ...currentFilters, searchQuery: query })}
              showQuickFilters={true}
              showSearchSuggestions={true}
              showFilterHistory={true}
              showActiveFilters={true}
              resultCount={filteredResults.length}
              persistToUrl={true}
              enableSharing={true}
              enableExport={true}
              onShare={handleShare}
              onExport={handleExport}
              onSavePreset={handleSavePreset}
              className={selectedLayout === 'sidebar' ? 'h-[600px]' : ''}
            />
          </div>
        </div>

        {/* Results Preview */}
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Filtered Results ({filteredResults.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share Results
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.slice(0, 12).map((article) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.random() * 0.1 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                    {article.title}
                  </h3>
                  <div className="flex space-x-1 ml-2">
                    {article.isPremium && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                        Premium
                      </Badge>
                    )}
                    {article.hasVideo && (
                      <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">
                        Video
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>{article.category}</span>
                  <span>•</span>
                  <span>{article.difficulty}</span>
                  <span>•</span>
                  <span>{article.readTime} min</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredResults.length > 12 && (
            <div className="text-center mt-6">
              <Button variant="outline">
                Load More Results ({filteredResults.length - 12} remaining)
              </Button>
            </div>
          )}
          
          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}