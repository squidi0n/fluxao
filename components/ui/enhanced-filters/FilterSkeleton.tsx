'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilterSkeletonProps {
  variant?: 'sidebar' | 'pills' | 'cards' | 'search' | 'modal';
  className?: string;
  count?: number;
}

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const SkeletonBox = ({ 
  width, 
  height, 
  className = '' 
}: { 
  width: string; 
  height: string; 
  className?: string; 
}) => (
  <div className={cn("relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700", className)} style={{ width, height }}>
    <motion.div
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"
    />
  </div>
);

export default function FilterSkeleton({
  variant = 'pills',
  className = '',
  count = 6
}: FilterSkeletonProps) {
  if (variant === 'sidebar') {
    return (
      <div className={cn("w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700", className)}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <SkeletonBox width="40px" height="40px" className="rounded-lg" />
            <div className="flex-1">
              <SkeletonBox width="80px" height="20px" className="mb-2" />
              <SkeletonBox width="120px" height="16px" />
            </div>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SkeletonBox width="100px" height="16px" className="mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <SkeletonBox width="100px" height="14px" />
                <SkeletonBox width="44px" height="20px" className="rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Filter Sections */}
        {[1, 2, 3, 4].map((section) => (
          <div key={section} className="border-b border-gray-200 dark:border-gray-700">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SkeletonBox width="16px" height="16px" />
                <SkeletonBox width="80px" height="16px" />
              </div>
              <SkeletonBox width="16px" height="16px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { delay: i * 0.1 }
            }}
            className="relative overflow-hidden"
          >
            <SkeletonBox 
              width={`${80 + Math.random() * 60}px`} 
              height="32px" 
              className="rounded-full"
            />
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: i * 0.1 }
            }}
            className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900"
          >
            <div className="flex items-center space-x-3 mb-3">
              <SkeletonBox width="40px" height="40px" className="rounded-xl" />
              <div className="flex-1">
                <SkeletonBox width="120px" height="16px" className="mb-1" />
                <SkeletonBox width="80px" height="12px" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <SkeletonBox width="60px" height="14px" />
              <SkeletonBox width="16px" height="16px" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'search') {
    return (
      <div className={cn("relative", className)}>
        <SkeletonBox width="100%" height="48px" className="rounded-xl mb-4" />
        
        {/* Popular queries */}
        <div className="flex flex-wrap gap-2">
          <SkeletonBox width="60px" height="16px" className="mr-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { delay: 0.1 + i * 0.05 }
              }}
            >
              <SkeletonBox 
                width={`${60 + Math.random() * 40}px`} 
                height="28px" 
                className="rounded-full"
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={cn("bg-white dark:bg-gray-900 rounded-2xl p-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <SkeletonBox width="40px" height="40px" className="rounded-lg" />
            <div>
              <SkeletonBox width="80px" height="20px" className="mb-1" />
              <SkeletonBox width="60px" height="14px" />
            </div>
          </div>
          <SkeletonBox width="24px" height="24px" className="rounded-full" />
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <SkeletonBox width="100px" height="20px" className="mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: i * 0.05 }
                }}
              >
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <SkeletonBox width="24px" height="24px" />
                    <div className="flex-1">
                      <SkeletonBox width="80px" height="16px" className="mb-1" />
                      <SkeletonBox width="120px" height="12px" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <SkeletonBox width="32px" height="32px" className="rounded-lg" />
                <SkeletonBox width="120px" height="16px" />
              </div>
              <SkeletonBox width="16px" height="16px" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <SkeletonBox width="120px" height="40px" className="rounded-lg" />
          <SkeletonBox width="140px" height="40px" className="rounded-lg flex-1" />
        </div>
      </div>
    );
  }

  return null;
}