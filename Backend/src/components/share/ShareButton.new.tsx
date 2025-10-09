// =====================================================
// B5 - SHARE BUTTON: Individual share button component
// =====================================================

"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import type { ShareChannel, ShareEntityType, ShareEntityData, ShareContext } from '@/lib/share/types';
import { buildShareUrl, getDeepLink, isShareFeatureEnabled } from '@/lib/share/index';
import { buildShareMessage, buildAgencyShareMessage } from '@/lib/share/message';
import { trackShareClick } from '@/lib/analytics/track';
import { SHARE_ICONS } from './icons';
import { cn } from '@/lib/utils';

export interface ShareButtonProps {
  channel: ShareChannel;
  entityType: ShareEntityType;
  entityId: string;
  entityData: ShareEntityData;
  context: ShareContext;
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onShare?: (channel: ShareChannel, url: string) => void;
}

const CHANNEL_LABELS: Record<ShareChannel, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  email: 'Email',
  copy: 'Copiar link',
  direct: 'Compartir',
};

const CHANNEL_COLORS: Record<ShareChannel, string> = {
  whatsapp: 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950',
  telegram: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950',
  facebook: 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950',
  x: 'hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900',
  email: 'hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950',
  copy: 'hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900',
  direct: 'hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900',
};

export function ShareButton({
  channel,
  entityType,
  entityId,
  entityData,
  context,
  className,
  showLabel = false,
  disabled = false,
  variant = 'outline',
  size = 'md',
  onShare,
}: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Check feature flag
  if (!isShareFeatureEnabled()) {
    return null;
  }

  const handleShare = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // 1. Build share URL with UTM params
      const shareUrlResult = buildShareUrl({
        entityType,
        entityId,
        context,
        channel,
      });

      // 2. Build optimized message (Prompt 7)
      const messageResult = entityType === 'property'
        ? buildShareMessage(entityData, channel, shareUrlResult.url, 'es-AR')
        : buildAgencyShareMessage(entityData, channel, shareUrlResult.url, 'es-AR');

      // 3. Get deeplink for the channel
      const deeplink = getDeepLink(
        channel,
        messageResult.body,
        shareUrlResult.url,
        messageResult.subject || `Propiedad en Misiones Arrienda: ${entityData.title}`
      );

      // 4. Handle copy vs open
      if (channel === 'copy') {
        await navigator.clipboard.writeText(shareUrlResult.url);
        setIsCopied(true);
        toast.success('Link copiado al portapapeles');
        
        // Reset copied state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        // Open in new window/tab
        window.open(deeplink, '_blank', 'noopener,noreferrer');
        toast.success(`Compartiendo en ${CHANNEL_LABELS[channel]}`);
      }

      // 5. Track analytics (Prompt 6)
      try {
        await trackShareClick({
          channel,
          entity: entityType,
          entity_id: entityId,
          context,
          plan_tier: 'free', // TODO: Get from user context
          user_id: undefined // TODO: Get from user context
        });
      } catch (error) {
        console.warn('[ShareButton] Analytics tracking failed:', error);
        // No bloquear el share si falla analytics
      }

      // 6. Call optional callback
      onShare?.(channel, shareUrlResult.url);

    } catch (error) {
      console.error('[ShareButton] Error sharing:', error);
      toast.error('Error al compartir. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get icon component
  const IconComponent = isCopied 
    ? SHARE_ICONS.check 
    : SHARE_ICONS[channel as keyof typeof SHARE_ICONS] || SHARE_ICONS.copy;

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      onClick={handleShare}
      disabled={disabled || isLoading}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        
        // Size
        sizeClasses[size],
        
        // Variant
        variantClasses[variant],
        
        // Channel-specific hover colors
        !disabled && CHANNEL_COLORS[channel],
        
        // Loading state
        isLoading && 'animate-pulse',
        
        // Copied state
        isCopied && 'bg-green-50 text-green-600 dark:bg-green-950',
        
        className
      )}
      aria-label={`Compartir en ${CHANNEL_LABELS[channel]}`}
      title={CHANNEL_LABELS[channel]}
    >
      <IconComponent className={iconSizeClasses[size]} />
      {showLabel && (
        <span className="hidden sm:inline">
          {isCopied ? '¡Copiado!' : CHANNEL_LABELS[channel]}
        </span>
      )}
    </button>
  );
}
