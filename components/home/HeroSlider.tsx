'use client';

import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './HeroSlider.css';

interface HeroSlide {
  id: string;
  title: string;
  teaser: string;
  coverImage: string;
  slug: string;
  category: {
    name: string;
    slug: string;
    color?: string;
  };
  author?: {
    name: string;
    avatar?: string;
  };
  publishedAt: Date;
  viewCount: number;
}

interface HeroSliderProps {
  slides?: HeroSlide[];
  posts?: any[];
  noContainer?: boolean; // Optional prop to disable the built-in container
}

export default function HeroSlider({ slides, posts, noContainer = false }: HeroSliderProps) {
  // Memoized slides conversion to prevent unnecessary recalculations
  const heroSlides = useMemo(() => {
    if (slides) return slides;
    if (!posts) return [];
    
    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      teaser: post.excerpt || '',
      coverImage:
        post.coverImage ||
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
      category: post.category || { name: 'Artikel', slug: 'artikel' },
      author: post.author || { name: 'FluxAO Team' },
      publishedAt: post.publishedAt || new Date(),
      viewCount: post.viewCount || 0,
    }));
  }, [slides, posts]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Preload next slide for smoother transition
  useEffect(() => {
    if (heroSlides && heroSlides.length > 1) {
      setNextSlide((currentSlide + 1) % heroSlides.length);
    }
  }, [currentSlide, heroSlides]);

  // Auto-play functionality with cross-fade approach
  useEffect(() => {
    if (!isAutoPlaying || !heroSlides || heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000); // Longer interval for better cross-fade experience

    return () => clearInterval(interval);
  }, [isAutoPlaying, heroSlides.length]);

  // Simplified slide change function
  const changeSlide = useCallback((newIndex: number) => {
    setCurrentSlide(newIndex);
    setIsAutoPlaying(false);
  }, []);

  const goToSlide = useCallback((index: number) => {
    changeSlide(index);
  }, [changeSlide]);

  const goToPrevious = useCallback(() => {
    const newIndex = (currentSlide - 1 + heroSlides.length) % heroSlides.length;
    changeSlide(newIndex);
  }, [currentSlide, heroSlides.length, changeSlide]);

  const goToNext = useCallback(() => {
    const newIndex = (currentSlide + 1) % heroSlides.length;
    changeSlide(newIndex);
  }, [currentSlide, heroSlides.length, changeSlide]);

  if (!heroSlides || heroSlides.length === 0) {
    return null;
  }

  const slide = useMemo(() => heroSlides[currentSlide], [heroSlides, currentSlide]);

  // Memoized category colors mapping
  const getCategoryColor = useCallback((slug: string) => {
    const colors: Record<string, string> = {
      'ki-tech': 'from-blue-600 to-cyan-600',
      'mensch-gesellschaft': 'from-green-600 to-emerald-600',
      'style-aesthetik': 'from-purple-600 to-pink-600',
      'gaming-kultur': 'from-red-600 to-orange-600',
      'mindset-philosophie': 'from-indigo-600 to-purple-600',
      'fiction-lab': 'from-orange-600 to-yellow-600',
    };
    return colors[slug] || 'from-gray-600 to-gray-700';
  }, []);

  const sliderContent = (
    <div
      className="relative w-full h-[500px] md:h-[600px] bg-black rounded-2xl overflow-hidden group shadow-2xl"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
        {/* All Slides - Layered with Transitions */}
        {heroSlides.map((slideItem, index) => (
          <div
            key={slideItem.id}
            ref={(el) => (slideRefs.current[index] = el)}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            {/* Background Image with Ken Burns Effect - Now Clickable */}
            <Link href={`/${slideItem.slug}`} className="absolute inset-0">
              <div className="absolute inset-0">
                {slideItem.coverImage ? (
                  <Image
                    src={slideItem.coverImage}
                    alt={slideItem.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900" />
                )}
                {/* Dark Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none" />
              </div>
            </Link>

            {/* Content - Animated on Slide Change */}
            {index === currentSlide && (
              <div className="relative h-full px-8 sm:px-12 lg:px-20 flex items-end pb-24 z-10 pointer-events-none">
                <div className="max-w-3xl hero-content pointer-events-auto">
                  {/* Category Badge */}
                  <div className="hero-category">
                    <Link
                      href={`/category/${slideItem.category.slug}`}
                      className={`inline-flex items-center px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${getCategoryColor(slideItem.category.slug)} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-4`}
                    >
                      {slideItem.category.name}
                    </Link>
                  </div>

                  {/* Title */}
                  <h1 className="hero-title text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    <Link
                      href={`/${slideItem.slug}`}
                      className="hover:text-gray-200 transition-colors"
                    >
                      {slideItem.title}
                    </Link>
                  </h1>

                  {/* Teaser */}
                  <p className="hero-teaser text-lg md:text-xl text-gray-200 mb-6 line-clamp-2">
                    {slideItem.teaser}
                  </p>

                </div>
              </div>
            )}
          </div>
        ))}

        {/* Navigation Arrows with Smooth Transition */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>


        {/* Slide Counter */}
        <div className="absolute top-8 right-8 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium z-20">
          {currentSlide + 1} / {heroSlides.length}
        </div>
      </div>
  );

  // Return with or without container based on noContainer prop
  return noContainer ? sliderContent : (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {sliderContent}
    </div>
  );
}
