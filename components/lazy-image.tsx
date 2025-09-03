'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0,
        rootMargin: '50px',
      },
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Generate blur placeholder if not provided
  const defaultBlurDataURL =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden bg-gray-100 dark:bg-gray-800', className)}
      style={{
        width: width || '100%',
        height: height || 'auto',
      }}
    >
      {isInView && (
        <>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL || defaultBlurDataURL}
            onLoad={handleLoad}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className,
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {!isLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
          )}
        </>
      )}
    </div>
  );
}

// Optimized background image with lazy loading
export function LazyBackgroundImage({
  src,
  className,
  children,
}: {
  src: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0,
        rootMargin: '100px',
      },
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setIsLoaded(true);
    };
  }, [isInView, src]);

  return (
    <div
      ref={containerRef}
      className={cn('relative bg-cover bg-center bg-no-repeat', className)}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : undefined,
      }}
    >
      {!isLoaded && <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />}
      {children}
    </div>
  );
}
