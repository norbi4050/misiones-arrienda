"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Search, Filter, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PropertyCard } from '@/components/property-card'
import { FavoriteButton } from '@/components/favorite-button'
import { useUserFavorites } from '@/hooks/useUserFavorites'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import Link from 'next/link'

export default function FavoritesPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth()
  const { 
    favorites, 
    loading, 
    error, 
    removeFavorite, 
    refreshFavorites,
    favoritesCount 
  } = useUserFavorites()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high'>('newest')
  const [showFilters, setShowFilters] = useState(false)

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/favorites')
    }
  }, [isAuthenticated, authLoading, router])

  // Filtrar y ordenar favoritos
  const filteredAndSortedFavorites = favorites
    .filter(fav => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        fav.property.title.toLowerCase().includes(searchLower) ||
        fav.property.description.toLowerCase().includes(searchLower) ||
        fav.property.location?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price_low':
          return a.property.price - b.property.price
        case 'price_high':
          return b.property.price - a.property.price
        default:
          return 0
      }
    })

  // Manejar eliminación de favorito
  const handleRemoveFavorite = async (propertyId: string) => {
    const success = await removeFavorite(propertyId)
    if (success) {
      // El hook ya actualiza el estado local
      console.log('Favorito eliminado exitosamente')
    }
  }

  // Manejar envío de mensaje
  const handleSendMessage = (propertyId: string, ownerId: string) => {
    router.push(`/messages/new?to=${ownerId}&propertyId=${propertyId}`)
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando tus favoritos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null // El useEffect ya redirige
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost" size="sm">
                  ← Volver a Propiedades
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-current" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
                  <p className="text-gray-600">
                    {favoritesCount === 0 
                      ? 'No tienes propiedades favoritas aún'
                      : `${favoritesCount} ${favoritesCount === 1 ? 'propiedad favorita' : 'propiedades favoritas'}`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {favoritesCount > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshFavorites}
                >
                  Actualizar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error state */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700">Error al cargar favoritos: {error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshFavorites}
                  className="ml-auto"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        {favoritesCount > 0 && (
          <div className={`mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Buscar en tus favoritos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="sm:w-48">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="newest">Más recientes</option>
                      <option value="oldest">Más antiguos</option>
                      <option value="price_low">Precio: menor a mayor</option>
                      <option value="price_high">Precio: mayor a menor</option>
                    </select>
                  </div>
                </div>

                {/* Active filters indicator */}
                {searchTerm && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Filtrando por:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {favoritesCount === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No tienes favoritos aún
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Explora propiedades y guarda las que más te gusten haciendo clic en el corazón ❤️
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties">
                <Button className="w-full sm:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Explorar Propiedades
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Favorites grid */
          <div>
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredAndSortedFavorites.length === favoritesCount 
                  ? `Mostrando ${favoritesCount} ${favoritesCount === 1 ? 'favorito' : 'favoritos'}`
                  : `Mostrando ${filteredAndSortedFavorites.length} de ${favoritesCount} favoritos`
                }
              </p>
              
              {searchTerm && filteredAndSortedFavorites.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>

            {/* No results for search */}
            {searchTerm && filteredAndSortedFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-600 mb-4">
                  No hay favoritos que coincidan con "{searchTerm}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </Button>
              </div>
            ) : (
              /* Properties grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedFavorites.map((favorite) => (
                  <div key={favorite.id} className="relative group">
                    {/* Property Card */}
                    <PropertyCard
                      id={favorite.property.id}
                      title={favorite.property.title}
                      price={favorite.property.price}
                      images={favorite.property.images}
                      city={favorite.property.location?.split(',')[0] || 'Ciudad'}
                      province={favorite.property.location?.split(',')[1] || 'Provincia'}
                      bedrooms={favorite.property.bedrooms}
                      bathrooms={favorite.property.bathrooms}
                      area={favorite.property.area}
                      propertyType={favorite.property.type}
                    />

                    {/* Quick actions overlay */}
                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                      {/* Remove from favorites */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveFavorite(favorite.property.id)
                        }}
                        className="bg-red-500/90 hover:bg-red-600 text-white"
                        title="Eliminar de favoritos"
                      >
                        ×
                      </Button>

                      {/* Send message */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Necesitamos el user_id del propietario - lo obtendremos del API
                          router.push(`/messages/new?propertyId=${favorite.property.id}`)
                        }}
                        className="bg-blue-500/90 hover:bg-blue-600 text-white"
                        title="Enviar mensaje"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Favorite date */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Agregado el {new Date(favorite.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick actions footer */}
        {favoritesCount > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
              <p className="text-gray-600">¿Buscas algo específico?</p>
              <Link href="/properties">
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Explorar más propiedades
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
