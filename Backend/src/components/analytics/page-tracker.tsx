"use client";

import { useEffect } from 'react';
import { analytics, track } from '@/lib/analytics/track';

interface PageTrackerProps {
  eventName: string;
  payload?: Record<string, any>;
}

export function PageTracker({ eventName, payload }: PageTrackerProps) {
  useEffect(() => {
    // Pequeño delay para asegurar que la página esté completamente cargada
    const timer = setTimeout(() => {
      if (eventName === 'visit_home') {
        analytics.visitHome();
      } else if (eventName === 'visit_properties') {
        analytics.visitProperties(payload);
      } else if (eventName === 'view_property') {
        analytics.viewProperty(
          payload?.propertyId,
          payload?.city,
          payload?.price,
          payload?.featured
        );
      } else if (eventName === 'start_publish') {
        analytics.startPublish();
      } else {
        // Evento genérico
        track(eventName, payload);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [eventName, payload]);

  return null; // Este componente no renderiza nada
}
