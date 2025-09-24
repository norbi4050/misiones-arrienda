'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Property } from '@/types/property'

export function useUserFavorites() {
  const { user } = useSupabaseAuth()
  const [favorites, setFavorites] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users/favorites')
      if (!response.ok) {
        throw new Error('Error al cargar favoritos')
      }
      
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (err: any) {
      console.error('Error fetching favorites:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addFavorite = async (propertyId: string) => {
    if (!user) return false

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId })
      })

      if (!response.ok) {
        throw new Error('Error al agregar favorito')
      }

      // Refrescar la lista
      await fetchFavorites()
      return true
    } catch (err: any) {
      console.error('Error adding favorite:', err)
      setError(err.message)
      return false
    }
  }

  const removeFavorite = async (propertyId: string) => {
    if (!user) return false

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId })
      })

      if (!response.ok) {
        throw new Error('Error al eliminar favorito')
      }

      // Actualizar estado local inmediatamente
      setFavorites(prev => prev.filter(p => p.id !== propertyId))
      return true
    } catch (err: any) {
      console.error('Error removing favorite:', err)
      setError(err.message)
      return false
    }
  }

  const isFavorite = (propertyId: string) => {
    return favorites.some(fav => fav.id === propertyId)
  }

  const toggleFavorite = async (propertyId: string) => {
    if (isFavorite(propertyId)) {
      return await removeFavorite(propertyId)
    } else {
      return await addFavorite(propertyId)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [user])

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
    favoritesCount: favorites.length
  }
}
