/**
 * B7: Property View Tracker
 * Componente client-side para trackear vistas de propiedades
 */

"use client";

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics/track';

interface PropertyViewTrackerProps {
  propertyId: string;
  propertyTitle?: string;
}

export function PropertyViewTracker({ propertyId, propertyTitle }: PropertyViewTrackerProps) {
  useEffect(() => {
    // B7: Track property view on mount
    try {
      analytics.viewProperty(propertyId, propertyTitle);
    } catch (error) {
      console.debug('[B7] Analytics tracking failed:', error);
    }
  }, [propertyId, propertyTitle]);

  // Este componente no renderiza nada
  return null;
}
