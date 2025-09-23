'use client'

import React, { useState, useEffect } from 'react'
import { Users, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import RoommateCard, { RoommateGrid } from '@/components/ui/roommate-card'
import RoommateFiltersComponent, { useRoommateFilters, RoommatePagination } from '@/components/ui/roommate-filters'
import { RoommatePost, RoommateApiResponse } from '@/types/roommate'

export default function RoommatesPage() {
  const [roommates, setRoommates] = useState<RoommatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Manejar filtros con hook personalizado
  const { filters, updateFilters } = useRoommateFilters({
    order: 'recent',
    page: 1,
    limit: 12
  })

  // Función para cargar roommates
  const loadRoommates = async (currentFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      // Construir query string
      const params = new URLSearchParams()
      
      if (currentFilters.q) params.append('q', currentFilters.q)
      if (currentFilters.city) params.append('city', currentFilters.city)
      if (currentFilters.province) params.append('province', currentFilters.province)
      if (currentFilters.roomType) params.append('roomType', currentFilters.roomType)
      if (currentFilters.minRent) params.append('minRent', currentFilters.minRent.toString())
      if (currentFilters.maxRent) params.append('maxRent', currentFilters.maxRent.toString())
      if (currentFilters.availableFrom) params.append('availableFrom', currentFilters.availableFrom)
      if (currentFilters.order) params.append('order', currentFilters.order)
      if (currentFilters.page) params.append('page', currentFilters.page.toString())
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString())

      console.log('Cargando roommates con filtros:', currentFilters)

      const response = await fetch(`/api/roommates?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: RoommateApiResponse = await response.json()
      
      console.log('Roommates cargados:', data.items.length, 'de', data.count)

      setRoommates(data.items)
      setTotalCount(data.count)
      setTotalPages(data.meta.pagination.totalPages)

    } catch (err) {
      console.error('Error cargando roommates:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setRoommates([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  // Cargar roommates cuando cambian los filtros
  useEffect(() => {
    loadRoommates(filters)
  }, [filters])

  // Manejar cambio de filtros
  const handleFiltersChange = (newFilters: typeof filters) => {
    updateFilters(newFilters)
  }

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    updateFilters({ page })
    // Scroll to top cuando cambia la página
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Manejar like (para usuarios no autenticados, redirigir a login)
  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`/api/roommates/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        // Redirigir a login
        window.location.href = '/login?redirect=/roommates'
        return
      }

      if (!response.ok) {
        throw new Error('Error al procesar like')
      }

      const result = await response.json()
      
      // Actualizar el roommate en la lista local
      setRoommates(prev => prev.map(roommate => 
        roommate.id === id 
          ? { ...roommate, likesCount: result.likesCount }
          : roommate
      ))

    } catch (err) {
      console.error('Error con like:', err)
      // Mostrar toast o notificación de error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                Roommates
              </h1>
              <p className="text-gray-600 mt-1">
                Encuentra tu compañero de casa ideal en Misiones
              </p>
            </div>
            
            <Link
              href="/roommates/nuevo"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Publicar Anuncio
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar con filtros */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <RoommateFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                loading={loading}
              />
            </div>
          </div>

          {/* Grid de roommates */}
          <div className="lg:col-span-3">
            
            {/* Estadísticas y ordenamiento */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                {loading ? (
                  'Cargando...'
                ) : error ? (
                  <span className="text-red-600">Error al cargar</span>
                ) : (
                  `${totalCount} roommate${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`
                )}
              </div>
              
              {!loading && !error && totalCount > 0 && (
                <div className="text-sm text-gray-500">
                  Página {filters.page || 1} de {totalPages}
                </div>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 font-medium mb-2">Error al cargar roommates</div>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button
                  onClick={() => loadRoommates()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Grid de roommates */}
            {!error && (
              <RoommateGrid
                roommates={roommates}
                loading={loading}
                onLike={handleLike}
                emptyMessage={
                  Object.keys(filters).some(key => filters[key as keyof typeof filters])
                    ? "No se encontraron roommates con estos filtros"
                    : "No hay roommates disponibles aún"
                }
              />
            )}

            {/* Paginación */}
            {!loading && !error && totalPages > 1 && (
              <RoommatePagination
                currentPage={filters.page || 1}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Call to action para usuarios sin posts */}
      {!loading && !error && totalCount === 0 && !Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Sé el primero en publicar!
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Ayuda a crear la comunidad de roommates en Misiones. 
              Publica tu anuncio y encuentra a tu compañero de casa ideal.
            </p>
            <Link
              href="/roommates/nuevo"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Publicar Mi Anuncio
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
