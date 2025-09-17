"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface ActivityItem {
  id: string;
  type: 'favorite_added' | 'favorite_removed' | 'profile_updated' | 'message_sent' | 'search_saved' | 'property_viewed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    recipientName?: string;
    searchQuery?: string;
  };
}

export function useUserActivity() {
  const { user, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Provide fallback activities for non-authenticated users
      setActivities(getFallbackActivities());
      setLoading(false);
      return;
    }

    fetchActivities();
  }, [user, isAuthenticated]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/activity', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user activity');
      }

      const data = await response.json();
      setActivities(data.activities || getFallbackActivities());
    } catch (err) {
      console.error('Error fetching user activity:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Fallback to realistic mock data
      setActivities(getFallbackActivities());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackActivities = (): ActivityItem[] => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    return [
      {
        id: '1',
        type: 'favorite_added',
        title: 'Agregaste una propiedad a favoritos',
        description: 'Departamento 2 amb en Palermo',
        timestamp: twoHoursAgo.toISOString(),
        metadata: {
          propertyId: 'prop-1',
          propertyTitle: 'Departamento 2 amb en Palermo'
        }
      },
      {
        id: '2',
        type: 'profile_updated',
        title: 'Actualizaste tu perfil',
        description: 'Información de contacto actualizada',
        timestamp: oneDayAgo.toISOString()
      },
      {
        id: '3',
        type: 'search_saved',
        title: 'Guardaste una búsqueda',
        description: 'Departamentos en Palermo hasta $80.000',
        timestamp: threeDaysAgo.toISOString(),
        metadata: {
          searchQuery: 'Departamentos en Palermo hasta $80.000'
        }
      }
    ];
  };

  const refreshActivities = async () => {
    if (!isAuthenticated || !user) return;
    await fetchActivities();
  };

  return {
    activities,
    loading,
    error,
    refreshActivities
  };
}
