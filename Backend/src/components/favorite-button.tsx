'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function FavoriteButton({
  propertyId,
  className = '',
  size = 'md',
  showText = false
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si la propiedad está en favoritos al cargar
  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, propertyId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const isPropertyFavorite = (data.items || []).some(
          (fav: any) => fav.property.id === propertyId
        );
        setIsFavorite(isPropertyFavorite);
      }
    } catch (error) {
      console.error('Error al verificar favoritos:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar favoritos');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId })
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);

        if (data.isFavorite) {
          toast.success('Agregado a favoritos ❤️');
        } else {
          toast.success('Eliminado de favoritos');
        }
      } else {
        throw new Error('Error al actualizar favoritos');
      }
    } catch (error) {
      console.error('Error al actualizar favoritos:', error);
      toast.error('Error al actualizar favoritos');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      size={showText ? "default" : "icon"}
      className={`
        ${sizeClasses[size]}
        ${isFavorite
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
          : 'hover:bg-red-50 hover:text-red-500 hover:border-red-300'
        }
        transition-all duration-200
        ${className}
      `}
      onClick={toggleFavorite}
      disabled={isLoading}
    >
      <Heart
        size={iconSizes[size]}
        className={`
          ${isFavorite ? 'fill-current' : ''}
          ${isLoading ? 'animate-pulse' : ''}
        `}
      />
      {showText && (
        <span className="ml-2">
          {isFavorite ? 'En Favoritos' : 'Agregar a Favoritos'}
        </span>
      )}
    </Button>
  );
}
