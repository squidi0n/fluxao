'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles, Zap, Brain, Palette, Gamepad2, Lightbulb, Filter, X, DollarSign, Rocket } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';
import { useCategories } from '@/hooks/useCategories';

interface CategoryStripProps {
  category?: {
    slug: string;
    name: string;
    description: string;
    subcategories?: string[];
  } | null;
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    subheading?: string | null;
    coverUrl?: string | null;
    excerpt?: string | null;
    publishedAt?: string;
    subcategory?: string | null;
    contentType?: 'TUTORIAL' | 'NEWS' | 'OPINION' | 'INTERVIEW' | 'REVIEW' | 'DEEP_DIVE';
    difficultyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    estimatedReadTime?: number | null;
    author: {
      name: string;
      avatarUrl?: string | null;
    };
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    tags?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  }>;
  showFilters?: boolean;
  onFilterChange?: (filters: any) => void;
}

const categoryStyles = {
  'ki-tech': {
    icon: Zap,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-950/20',
  },
  'mensch-gesellschaft': {
    icon: Brain,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    darkBgColor: 'dark:bg-green-950/20',
  },
  'design-aesthetik': {
    icon: Palette,
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
    darkBgColor: 'dark:bg-pink-950/20',
  },
  'gaming-kultur': {
    icon: Gamepad2,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-950/20',
  },
  'mindset-philosophie': {
    icon: Lightbulb,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    darkBgColor: 'dark:bg-amber-950/20',
  },
  'business-finance': {
    icon: DollarSign,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-950/20',
  },
  'future-science': {
    icon: Rocket,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    darkBgColor: 'dark:bg-indigo-950/20',
  },
  'fiction-lab': {
    icon: Sparkles,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    darkBgColor: 'dark:bg-red-950/20',
  },
} as const;

export default function CategoryStrip({ 
  category, 
  posts, 
  showFilters = false, 
  onFilterChange 
}: CategoryStripProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  
  // Add null check for category and provide fallback
  if (!category) {
    return null; // or return a loading/error state
  }
  
  const style = categoryStyles[category.slug as keyof typeof categoryStyles] || categoryStyles['ki-tech'];
  const Icon = style.icon;

  // Filter posts based on selected filters
  const filteredPosts = posts.filter(post => {
    if (selectedSubcategory && post.subcategory !== selectedSubcategory) return false;
    if (selectedContentType && post.contentType !== selectedContentType) return false;
    if (selectedDifficulty && post.difficultyLevel !== selectedDifficulty) return false;
    return true;
  });

  // Get unique subcategories from posts
  const availableSubcategories = Array.from(
    new Set(posts.map(post => post.subcategory).filter(Boolean))
  );

  const handleFilterChange = (type: string, value: string | null) => {
    switch (type) {
      case 'subcategory':
        setSelectedSubcategory(value);
        break;
      case 'contentType':
        setSelectedContentType(value);
        break;
      case 'difficulty':
        setSelectedDifficulty(value);
        break;
    }

    if (onFilterChange) {
      onFilterChange({
        subcategory: type === 'subcategory' ? value : selectedSubcategory,
        contentType: type === 'contentType' ? value : selectedContentType,
        difficulty: type === 'difficulty' ? value : selectedDifficulty,
      });
    }
  };

  return (
    <section className="py-12 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
              className={`w-12 h-12 rounded-xl ${style.bgColor} ${style.darkBgColor} flex items-center justify-center`}
            >
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </motion.div>
            
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {category.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
            </div>
          </div>

          <Link
            href={`/category/${category.slug}`}
            className="group flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Alle ansehen
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Subcategory and Filter Controls */}
        {showFilters && (availableSubcategories.length > 0 || posts.some(p => p.contentType || p.difficultyLevel)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-3">
              {/* Subcategory Filters */}
              {availableSubcategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                    Subcategories:
                  </span>
                  {availableSubcategories.map((subcategory) => (
                    <button
                      key={subcategory}
                      onClick={() => handleFilterChange('subcategory', 
                        selectedSubcategory === subcategory ? null : subcategory
                      )}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedSubcategory === subcategory
                          ? `${style.bgColor} ${style.iconColor} ${style.darkBgColor}`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {subcategory}
                      {selectedSubcategory === subcategory && (
                        <X className="w-3.5 h-3.5 ml-1.5 inline" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Content Type Filters */}
              {posts.some(p => p.contentType) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                    Type:
                  </span>
                  {['TUTORIAL', 'NEWS', 'OPINION', 'INTERVIEW', 'REVIEW', 'DEEP_DIVE'].map((type) => {
                    const hasType = posts.some(p => p.contentType === type);
                    if (!hasType) return null;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => handleFilterChange('contentType', 
                          selectedContentType === type ? null : type
                        )}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          selectedContentType === type
                            ? `${style.bgColor} ${style.iconColor} ${style.darkBgColor}`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {type.toLowerCase().replace('_', ' ')}
                        {selectedContentType === type && (
                          <X className="w-3.5 h-3.5 ml-1.5 inline" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Difficulty Filters */}
              {posts.some(p => p.difficultyLevel) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                    Difficulty:
                  </span>
                  {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => {
                    const hasLevel = posts.some(p => p.difficultyLevel === level);
                    if (!hasLevel) return null;
                    
                    return (
                      <button
                        key={level}
                        onClick={() => handleFilterChange('difficulty', 
                          selectedDifficulty === level ? null : level
                        )}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          selectedDifficulty === level
                            ? `${style.bgColor} ${style.iconColor} ${style.darkBgColor}`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {level.toLowerCase()}
                        {selectedDifficulty === level && (
                          <X className="w-3.5 h-3.5 ml-1.5 inline" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPosts.slice(0, 3).map((post) => (
              <motion.div
                key={post.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center"
          >
            <Icon className={`w-12 h-12 ${style.iconColor} mx-auto mb-4 opacity-40`} />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Noch keine Artikel in dieser Kategorie vorhanden.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Neue Inhalte kommen bald!</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}