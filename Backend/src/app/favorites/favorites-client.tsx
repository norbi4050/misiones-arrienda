'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PropertyCard } from '@/components/property-card'
import { toast } from 'sonner'

interface Property {
  id: string
  title: string
  price: number
  currency: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  area: number
  address: string
  city: string
  latitude?: number
  longitude?: number
  images: string[]
  cover_url: string
  featured: boolean
  status: string
  created_at: string
  updated_at: string
  user_id: string
}

interface FavoritesClientProps {
  initialFavorites: Property[]
}

export default function FavoritesClient({ initialFavorites }: FavoritesClientProps) {
  const [favorites, setFavorites] = useState<Property[]>(initialFavorites)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const removeFavorite = async (propertyId: string) => {
    // Optimistic update - remover inmediatamente de la UI
    const originalFavorites = favorites
    setFavorites(prev => prev.filter(p => p.id !== propertyId))

    try {
      const response = await fetch(`/api/favorites/${propertyId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar favorito')
      }

      toast.success('Eliminado de favoritos')
      
      // Revalidar la página para actualizar el servidor
      router.refresh()
    } catch (error) {
      console.error('Error removing favorite:', error)
      // Rollback en caso de error
      setFavorites(originalFavorites)
      toast.error('Error al eliminar favorito')
    }
  }

  const filteredFavorites = favorites.filter((property: Property) =>
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
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

      {/* No Results */}
      {favorites.length > 0 && filteredFavorites.length === 0 && (
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
      {filteredFavorites.length > 0 && (
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
                image={property.cover_url}
                cover_url={property.cover_url}
                coverUrl={property.cover_url}
                imageUrls={property.images}
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
    </>
  )
}
