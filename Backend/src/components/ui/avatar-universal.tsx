"use client";

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from "@/utils";
import { getAvatarConfig } from "@/utils/avatar";

export interface AvatarUniversalProps {
  src?: string | null;
  name?: string | null;
  updatedAt?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showFallback?: boolean;
  onClick?: () => void;
  loading?: boolean;
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

export function AvatarUniversal({
  src,
  name,
  updatedAt,
  size = 'md',
  className,
  showFallback = true,
  onClick,
  loading = false
}: AvatarUniversalProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Get avatar configuration with cache-busting
  const avatarConfig = getAvatarConfig({
    profileImage: src || undefined,
    updatedAt: updatedAt || undefined,
    fallbackInitials: name || undefined,
    size: parseInt(sizeClasses[size].match(/w-(\d+)/)?.[1] || '10') * 4 // Convert to pixels
  });

  const shouldShowImage = avatarConfig.url && !imageError && showFallback;
  const shouldShowFallback = !shouldShowImage && showFallback;
  const isLoading = loading || (shouldShowImage && imageLoading);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const baseClasses = cn(
    "relative rounded-full overflow-hidden border-2 border-white shadow-sm bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center",
    sizeClasses[size],
    onClick && "cursor-pointer hover:scale-105 transition-transform duration-200",
    isLoading && "animate-pulse",
    className
  );

  return (
    <div className={baseClasses} onClick={onClick}>
      {/* Image */}
      {shouldShowImage && avatarConfig.url && (
        <img
          src={avatarConfig.url}
          alt={`Avatar de ${name ?? 'Usuario'}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
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

      {/* Cache-busted indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && avatarConfig.cacheBusted && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" 
             title="Cache-busted URL" />
      )}
    </div>
  );
}

export default AvatarUniversal;
