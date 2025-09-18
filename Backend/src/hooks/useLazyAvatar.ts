"use client";

import { useState, useEffect, useRef } from 'react';
import { getAvatarUrl } from '@/utils/avatar';

interface UseLazyAvatarOptions {
  src?: string | null;
  updatedAt?: string | null;
  threshold?: number;
  rootMargin?: string;
}

interface LazyAvatarState {
  isVisible: boolean;
  isLoaded: boolean;
  hasError: boolean;
  cacheBustedUrl: string | null;
}

/**
 * Hook para lazy loading de avatares con cache-busting
 * Optimiza el rendimiento cargando avatares solo cuando son visibles
 */
export function useLazyAvatar({
  src,
  updatedAt,
  threshold = 0.1,
  rootMargin = '50px'
}: UseLazyAvatarOptions): LazyAvatarState & {
  ref: React.RefObject<HTMLDivElement>;
} {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Generar URL con cache-busting
  const cacheBustedUrl = getAvatarUrl({
    profileImage: src,
    updatedAt
  });

  // Intersection Observer para lazy loading
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  // Precargar imagen cuando se hace visible
  useEffect(() => {
    if (!isVisible || !cacheBustedUrl) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setHasError(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
    };

    img.src = cacheBustedUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isVisible, cacheBustedUrl]);

  // Reset states when URL changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [cacheBustedUrl]);

  return {
    ref,
    isVisible,
    isLoaded,
    hasError,
    cacheBustedUrl
  };
}

export default useLazyAvatar;
