// =====================================================
// B5 - SHARE BAR: Main share bar component
// =====================================================

"use client";

import { useState, useEffect } from 'react';
import type { ShareEntityType, ShareEntityData, ShareContext, ShareChannel } from '@/lib/share/types';
import { isShareFeatureEnabled } from '@/lib/share/index';
import { ShareButton } from './ShareButton.new';
import { cn } from '@/lib/utils';

export interface ShareBarProps {
  entityType: ShareEntityType;
  entityId: string;
  entityData: ShareEntityData;
  context: ShareContext;
  className?: string;
  variant?: 'horizontal' | 'grid' | 'compact';
  showLabels?: boolean;
  disabled?: boolean;
  channels?: ShareChannel[];
  onShare?: (channel: ShareChannel, url: string) => void;
}

// Default channels to show
const DEFAULT_CHANNELS: ShareChannel[] = [
  'whatsapp',
  'telegram',
  'facebook',
  'x',
  'email',
  'copy',
];

// Channels that don't support web sharing (show tooltip)
// Note: Instagram and TikTok are not included in ShareChannel type
// They will be added in a future iteration with proper tooltip support
const UNSUPPORTED_CHANNELS: string[] = [];

export function ShareBar({
  entityType,
  entityId,
  entityData,
  context,
  className,
  variant = 'horizontal',
  showLabels = false,
  disabled = false,
  channels = DEFAULT_CHANNELS,
  onShare,
}: ShareBarProps) {
  // ✅ FIX HYDRATION: Solo renderizar en cliente
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check feature flag
  if (!isShareFeatureEnabled()) {
    return null;
  }

  // No renderizar en servidor - previene hydration error
  if (!mounted) {
    return null;
  }

  // Variant classes
  const variantClasses = {
    horizontal: 'flex flex-row flex-wrap gap-2 items-center',
    grid: 'grid grid-cols-3 sm:grid-cols-6 gap-2',
    compact: 'flex flex-row gap-1 items-center',
  };

  return (
    <div
      className={cn(
        'share-bar',
        variantClasses[variant],
        className
      )}
      role="group"
      aria-label="Compartir en redes sociales"
    >
      {channels.map((channel) => (
        <ShareButton
          key={channel}
          channel={channel}
          entityType={entityType}
          entityId={entityId}
          entityData={entityData}
          context={context}
          showLabel={showLabels}
          disabled={disabled || UNSUPPORTED_CHANNELS.includes(channel)}
          variant="outline"
          size={variant === 'compact' ? 'sm' : 'md'}
          onShare={onShare}
        />
      ))}
      
      {/* Optional: Show Instagram/TikTok with tooltip */}
      {/* This can be added in a future iteration with a Tooltip component */}
    </div>
  );
}

// Export a simpler version for quick use
export function PropertyShareBar({
  propertyId,
  propertyData,
  context = 'detail',
  className,
}: {
  propertyId: string;
  propertyData: ShareEntityData;
  context?: ShareContext;
  className?: string;
}) {
  return (
    <ShareBar
      entityType="property"
      entityId={propertyId}
      entityData={propertyData}
      context={context}
      className={className}
      showLabels={false}
    />
  );
}

export function AgencyShareBar({
  agencyId,
  agencyData,
  context = 'profile',
  className,
}: {
  agencyId: string;
  agencyData: ShareEntityData;
  context?: ShareContext;
  className?: string;
}) {
  return (
    <ShareBar
      entityType="agency"
      entityId={agencyId}
      entityData={agencyData}
      context={context}
      className={className}
      variant="compact"
      showLabels={false}
    />
  );
}
