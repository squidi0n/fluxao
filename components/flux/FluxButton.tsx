'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface FluxButtonProps {
  postId: string;
  initialUserFlux?: number;
  initialTotalFlux?: number;
  className?: string;
}

export default function FluxButton({
  postId,
  initialUserFlux = 0,
  initialTotalFlux = 0,
  className,
}: FluxButtonProps) {
  const { user } = useAuth();
  const [userFlux, setUserFlux] = useState(initialUserFlux);
  const [totalFlux, setTotalFlux] = useState(initialTotalFlux);
  const [isLoading, setIsLoading] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [tempFlux, setTempFlux] = useState(userFlux);
  const [showAnimation, setShowAnimation] = useState(false);

  const debouncedFlux = useDebounce(tempFlux, 300);

  // Load initial flux count
  useEffect(() => {
    if (user?.id && !initialUserFlux) {
      fetch(`/api/flux/me?postId=${postId}`)
        .then((res) => res.json())
        .then((data) => {
          setUserFlux(data.userFlux || 0);
          setTempFlux(data.userFlux || 0);
          setTotalFlux(data.totalFlux || 0);
        })
        .catch(console.error);
    }
  }, [user, postId, initialUserFlux]);

  // Save flux when debounced value changes
  useEffect(() => {
    if (debouncedFlux !== userFlux && user?.id) {
      saveFlux(debouncedFlux);
    }
  }, [debouncedFlux]);

  const saveFlux = async (count: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/flux/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, count }),
      });

      if (response.ok) {
        const data = await response.json();
        const diff = count - userFlux;
        setUserFlux(count);
        setTotalFlux(data.totalFlux);

        if (diff > 0) {
          triggerAnimation();
        }
      } else if (response.status === 429) {
        // Rate limited
        const data = await response.json();
        alert(`Zu viele Anfragen. Bitte warte ${data.retryAfter} Sekunden.`);
        setTempFlux(userFlux); // Reset to last saved value
      }
    } catch (error) {
      // console.error('Error saving flux:', error);
      setTempFlux(userFlux); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAnimation = () => {
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
  };

  const handleQuickFlux = () => {
    if (!user) {
      alert('Bitte melde dich an, um Flux zu geben!');
      return;
    }

    const newFlux = Math.min(tempFlux + 10, 50);
    setTempFlux(newFlux);
    triggerAnimation();
  };

  const handleSliderChange = (value: number) => {
    setTempFlux(value);
  };

  if (!user) {
    return (
      <button
        onClick={() => alert('Bitte melde dich an, um Flux zu geben!')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
          'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          className,
        )}
      >
        <Zap className="w-4 h-4" />
        <span className="font-medium">{totalFlux}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Main Flux Button */}
        <button
          onClick={handleQuickFlux}
          onMouseEnter={() => setShowSlider(true)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2 rounded-full transition-all',
            userFlux > 0
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
            'hover:scale-105 active:scale-95',
            isLoading && 'opacity-50 cursor-wait',
            className,
          )}
        >
          <Zap className={cn('w-4 h-4', userFlux > 0 && 'fill-current')} />
          <span className="font-bold">{totalFlux}</span>

          {/* User's flux indicator */}
          {userFlux > 0 && (
            <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
              {userFlux}
            </span>
          )}

          {/* Animation particles */}
          <AnimatePresence>
            {showAnimation && (
              <>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 pointer-events-none"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: 2,
                      opacity: 0,
                      x: (Math.random() - 0.5) * 50,
                      y: (Math.random() - 0.5) * 50,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: 'easeOut',
                    }}
                  >
                    <Zap className="w-4 h-4 text-purple-500" />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </button>

        {/* Slider */}
        <AnimatePresence>
          {showSlider && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onMouseEnter={() => setShowSlider(true)}
              onMouseLeave={() => setShowSlider(false)}
              className="absolute left-full ml-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">0</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempFlux}
                  onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                  className="w-32 accent-purple-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">50</span>
                <span className="ml-2 font-bold text-purple-600 dark:text-purple-400 min-w-[2ch]">
                  {tempFlux}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Gib bis zu 50 Flux! ⚡
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trending indicator */}
      {totalFlux > 100 && (
        <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-orange-500">
          <TrendingUp className="w-3 h-3" />
          <span>Trending!</span>
        </div>
      )}
    </div>
  );
}
