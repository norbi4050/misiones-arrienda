'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { PropertyCard } from '@/components/property-card'
import { Property } from '@/types/property'

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const [favorites, setFavorites] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/favorites')
      if (!response.ok) {
        throw new Error('Error al cargar favoritos')
      }
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (propertyId: string) => {
    try {
      const response = await fetch('/api/users/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })
      if (response.ok) {
        setFavorites(prev => prev.filter(p => p.id !== propertyId))
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredFavorites = favorites.filter((property: Property) =>
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Favoritos
          </h1>
          <p className="text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
          </p>
        </div>

        {/* Search */}
        {favorites.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar en favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            <span className="ml-3 text-gray-600">Cargando favoritos...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <span className="text-red-600 text-4xl mb-4 block">⚠️</span>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error al cargar favoritos
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && favorites.length === 0 && (
          <div className="text-center py-12">
            <span className="text-gray-400 text-6xl mb-6 block">❤️</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes favoritos aún
            </h3>
            <p className="text-gray-600 mb-6">
              Explora propiedades y guarda las que más te gusten
            </p>
            <button
              onClick={() => router.push('/properties')}
              className="bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition-colors font-medium"
            >
              Explorar Propiedades
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && favorites.length > 0 && filteredFavorites.length === 0 && (
          <div className="text-center py-12">
            <span className="text-gray-400 text-6xl mb-6 block">🔍</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta con otros términos de búsqueda
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && !error && filteredFavorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFavorites.map((property: Property) => (
              <div key={property.id} className="relative">
                <PropertyCard
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  type={property.propertyType}
                  location={property.address || property.city || 'Ubicación no disponible'}
                  bedrooms={property.bedrooms || 0}
                  bathrooms={property.bathrooms || 0}
                  area={property.area || 0}
                  image={property.images?.[0] || '/placeholder-house-1.jpg'}
                  featured={property.featured}
                />
                <button
                  onClick={() => removeFavorite(property.id)}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-red-500 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                  title="Eliminar de favoritos"
                >
                  <span className="text-lg">❤️</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
