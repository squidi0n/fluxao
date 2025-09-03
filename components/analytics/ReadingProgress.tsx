'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, BookOpen, TrendingUp } from 'lucide-react';

interface ReadingProgressProps {
  className?: string;
  showEstimate?: boolean;
  estimatedReadTime?: number;
  wordsCount?: number;
}

export function ReadingProgress({ 
  className = '', 
  showEstimate = true,
  estimatedReadTime = 5,
  wordsCount = 1000,
}: ReadingProgressProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(200); // words per minute
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(estimatedReadTime);
  
  const startTimeRef = useRef<number>(Date.now());
  const lastScrollRef = useRef<number>(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(100, Math.round((scrollTop / documentHeight) * 100));
      
      setScrollProgress(progress);
      lastScrollRef.current = Date.now();

      // Calculate reading time
      const currentTime = Date.now();
      const timeSpent = (currentTime - startTimeRef.current) / 1000 / 60; // minutes
      setReadingTime(timeSpent);

      // Estimate reading speed based on scroll progress and time
      if (progress > 10 && timeSpent > 0.5) {
        const wordsRead = (wordsCount * progress) / 100;
        const calculatedSpeed = wordsRead / timeSpent;
        if (calculatedSpeed > 50 && calculatedSpeed < 500) {
          setReadingSpeed(calculatedSpeed);
        }
      }

      // Calculate estimated time remaining
      if (progress > 5) {
        const wordsRemaining = wordsCount * (1 - progress / 100);
        const timeLeft = Math.max(0, wordsRemaining / readingSpeed);
        setEstimatedTimeLeft(timeLeft);
      }

      // Show/hide based on scroll position
      setIsVisible(progress > 5 && progress < 95);
    };

    // Throttle scroll updates
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial update
    updateProgress();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [wordsCount, readingSpeed]);

  const formatTime = (minutes: number): string => {
    if (minutes < 1) {
      return '< 1 min';
    } else if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 25) return 'bg-blue-500';
    if (progress < 50) return 'bg-green-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getProgressText = (progress: number): string => {
    if (progress < 25) return 'Getting started...';
    if (progress < 50) return 'Making progress...';
    if (progress < 75) return 'Halfway there!';
    if (progress < 90) return 'Almost done!';
    return 'Nearly finished!';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${className}`}
      role="progressbar"
      aria-valuenow={scrollProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Reading progress: ${scrollProgress}% complete`}
    >
      {/* Progress Bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${getProgressColor(scrollProgress)}`}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Progress Information */}
      {showEstimate && (
        <div className="px-4 py-2 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {scrollProgress}% • {getProgressText(scrollProgress)}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {formatTime(readingTime)} read
                </span>
              </div>
              
              {estimatedTimeLeft > 0.1 && (
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {formatTime(estimatedTimeLeft)} left
                  </span>
                </div>
              )}
            </div>

            {/* Reading Speed Indicator */}
            <div className="flex items-center space-x-2 text-gray-500">
              <span className="text-xs">
                {Math.round(readingSpeed)} wpm
              </span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for article headers
interface ReadingProgressBarProps {
  className?: string;
}

export function ReadingProgressBar({ className = '' }: ReadingProgressBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(100, Math.round((scrollTop / documentHeight) * 100));
      setScrollProgress(progress);
    };

    const handleScroll = () => {
      requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress(); // Initial update

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-500 transition-all duration-150 ease-out rounded-full"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

// Hook for other components to use reading progress
export function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(100, Math.round((scrollTop / documentHeight) * 100));
      
      setProgress(scrollProgress);
      setReadingTime((Date.now() - startTime.current) / 1000 / 60);
    };

    const handleScroll = () => {
      requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    progress,
    readingTime,
    isStarted: progress > 5,
    isFinished: progress > 90,
  };
}