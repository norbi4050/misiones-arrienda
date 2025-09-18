"use client";

import React, { useState, useCallback } from 'react';
import { User } from 'lucide-react';
import { cn } from "@/utils";
import { getAvatarConfig } from "@/utils/avatar";
import { useLazyAvatar } from "@/hooks/useLazyAvatar";

export interface AvatarOptimizedProps {
  src?: string | null;
  name?: string | null;
  updatedAt?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showFallback?: boolean;
  onClick?: () => void;
  loading?: boolean;
  lazy?: boolean;
  priority?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl'
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10'
};

/**
 * Componente Avatar optimizado con lazy loading, compresión y cache-busting
 */
export function AvatarOptimized({
  src,
  name,
  updatedAt,
  size = 'md',
  className,
  showFallback = true,
  onClick,
  loading = false,
  lazy = true,
  priority = false
}: AvatarOptimizedProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Usar lazy loading si está habilitado
  const lazyAvatar = useLazyAvatar({
    src,
    updatedAt,
    threshold: 0.1,
    rootMargin: '50px'
  });

  // Get avatar configuration with cache-busting
  const avatarConfig = getAvatarConfig({
    profileImage: src || undefined,
    updatedAt: updatedAt || undefined,
    fallbackInitials: name || undefined,
    size: parseInt(sizeClasses[size].match(/w-(\d+)/)?.[1] || '10') * 4
  });

  // Determinar si mostrar imagen
  const shouldShowImage = lazy 
    ? (lazyAvatar.isVisible && lazyAvatar.cacheBustedUrl && !imageError && showFallback)
    : (avatarConfig.url && !imageError && showFallback);

  const shouldShowFallback = !shouldShowImage && showFallback;
  const isLoading = loading || (shouldShowImage && (lazy ? !lazyAvatar.isLoaded : imageLoading));

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  const baseClasses = cn(
    "relative rounded-full overflow-hidden border-2 border-white shadow-sm bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center",
    sizeClasses[size],
    onClick && "cursor-pointer hover:scale-105 transition-transform duration-200",
    isLoading && "animate-pulse",
    className
  );

  // URL de la imagen a mostrar
  const imageUrl = lazy ? lazyAvatar.cacheBustedUrl : avatarConfig.url;

  return (
    <div 
      className={baseClasses} 
      onClick={onClick}
      ref={lazy ? lazyAvatar.ref : undefined}
    >
      {/* Image */}
      {shouldShowImage && imageUrl && (
        <img
          src={imageUrl}
          alt={`Avatar de ${name ?? 'Usuario'}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            (lazy ? lazyAvatar.isLoaded : !imageLoading) ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      )}

      {/* Fallback with initials */}
      {shouldShowFallback && (
        <div className="w-full h-full flex items-center justify-center text-white font-bold">
          {avatarConfig.initials !== 'U' ? (
            <span>{avatarConfig.initials}</span>
          ) : (
            <User className={iconSizes[size]} />
          )}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && shouldShowImage && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
      )}

      {/* Performance indicators (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {/* Cache-busted indicator */}
          {avatarConfig.cacheBusted && (
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" 
              title="Cache-busted URL" 
            />
          )}
          
          {/* Lazy loading indicator */}
          {lazy && (
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white" 
              title="Lazy loaded" 
            />
          )}
          
          {/* Priority indicator */}
          {priority && (
            <div 
              className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border border-white" 
              title="High priority" 
            />
          )}
        </>
      )}
    </div>
  );
}

export default AvatarOptimized;
