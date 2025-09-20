"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface FavoriteProperty {
  id: string;
  created_at: string;
  property: {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    images: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    type: string;
    status: string;
    created_at: string;
  };
}

export function useUserFavorites() {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    fetchFavorites();
  }, [user, isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/favorites', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Si es error 400 o 500, probablemente las tablas no existen
        if (response.status === 400 || response.status === 500) {
          console.warn('Sistema de favoritos no disponible - tablas no configuradas');
          setFavorites([]);
          setError(null); // No mostrar error al usuario
          return;
        }
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavorites(data.items || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      // Solo mostrar error si no es problema de tablas faltantes
      if (err instanceof Error && !err.message.includes('tablas no configuradas')) {
        setError(err.message);
      } else {
        setError(null);
      }
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (propertyId: string) => {
    if (!isAuthenticated || !user) return false;

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add favorite');
      }

      const data = await response.json();

      if (data.isFavorite) {
        // Refresh favorites list
        await fetchFavorites();
      }

      return data.isFavorite;
    } catch (err) {
      console.error('Error adding favorite:', err);
      return false;
    }
  };

  const removeFavorite = async (propertyId: string) => {
    if (!isAuthenticated || !user) return false;

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      const data = await response.json();

      if (!data.isFavorite) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId));
      }

      return !data.isFavorite;
    } catch (err) {
      console.error('Error removing favorite:', err);
      return false;
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    const isFavorite = favorites.some(fav => fav.property.id === propertyId);

    if (isFavorite) {
      return await removeFavorite(propertyId);
    } else {
      return await addFavorite(propertyId);
    }
  };

  const isFavorite = (propertyId: string) => {
    return favorites.some(fav => fav.property.id === propertyId);
  };

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites,
    favoritesCount: favorites.length
  };
}
