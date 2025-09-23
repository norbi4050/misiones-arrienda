'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, X, MapPin, Home, Calendar, DollarSign } from 'lucide-react'
import { RoommateFilters, RoomType } from '@/types/roommate'

interface RoommateFiltersProps {
  filters: RoommateFilters
  onFiltersChange: (filters: RoommateFilters) => void
  loading?: boolean
  className?: string
}

export default function RoommateFiltersComponent({ 
  filters, 
  onFiltersChange, 
  loading = false,
  className = '' 
}: RoommateFiltersProps) {
  
  const [localFilters, setLocalFilters] = useState<RoommateFilters>(filters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Sincronizar filtros locales con props
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Manejar cambios en filtros con debounce para búsqueda
  const handleFilterChange = (key: keyof RoommateFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)

    // Debounce para búsqueda de texto
    if (key === 'q') {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      
      const timeout = setTimeout(() => {
        onFiltersChange(newFilters)
      }, 500) // 500ms debounce
      
      setSearchTimeout(timeout)
    } else {
      // Aplicar inmediatamente para otros filtros
      onFiltersChange(newFilters)
    }
  }

  // Limpiar todos los filtros
  const clearFilters = () => {
    const clearedFilters: RoommateFilters = {
      order: 'recent',
      page: 1,
      limit: 12
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return !!(localFilters.q || localFilters.city || localFilters.province || 
              localFilters.roomType || localFilters.minRent || localFilters.maxRent || 
              localFilters.availableFrom)
  }

  // Opciones de ciudades principales de Misiones
  const cities = [
    'Posadas',
    'Puerto Iguazú',
    'Oberá',
    'Eldorado',
    'Apóstoles',
    'Leandro N. Alem',
    'Puerto Rico',
    'Montecarlo',
    'Jardín América',
    'Wanda'
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Búsqueda principal */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar roommates por título, descripción o ubicación..."
          value={localFilters.q || ''}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          disabled={loading}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        {localFilters.q && (
          <button
            onClick={() => handleFilterChange('q', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Orden */}
        <select
          value={localFilters.order || 'recent'}
          onChange={(e) => handleFilterChange('order', e.target.value)}
          disabled={loading}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="recent">Más Recientes</option>
          <option value="trending">Más Populares</option>
        </select>

        {/* Tipo de habitación */}
        <select
          value={localFilters.roomType || ''}
          onChange={(e) => handleFilterChange('roomType', e.target.value || undefined)}
          disabled={loading}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="">Todos los tipos</option>
          <option value="PRIVATE">Habitación Privada</option>
          <option value="SHARED">Habitación Compartida</option>
        </select>

        {/* Botón de filtros avanzados */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={loading}
          className={`flex items-center px-3 py-2 border rounded-md text-sm transition-colors disabled:opacity-50 ${
            showAdvanced || hasActiveFilters()
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4 mr-1" />
          Filtros
          {hasActiveFilters() && (
            <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {/* Botón limpiar filtros */}
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </button>
        )}
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ciudad
              </label>
              <select
                value={localFilters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Todas las ciudades</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                value={localFilters.province || ''}
                onChange={(e) => handleFilterChange('province', e.target.value || undefined)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Todas las provincias</option>
                <option value="Misiones">Misiones</option>
              </select>
            </div>
          </div>

          {/* Rango de precios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Rango de Precio (ARS por mes)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="Precio mínimo"
                  value={localFilters.minRent || ''}
                  onChange={(e) => handleFilterChange('minRent', e.target.value ? Number(e.target.value) : undefined)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Precio máximo"
                  value={localFilters.maxRent || ''}
                  onChange={(e) => handleFilterChange('maxRent', e.target.value ? Number(e.target.value) : undefined)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Fecha disponible desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Disponible desde
            </label>
            <input
              type="date"
              value={localFilters.availableFrom || ''}
              onChange={(e) => handleFilterChange('availableFrom', e.target.value || undefined)}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* Resumen de filtros activos */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {localFilters.q && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Búsqueda: "{localFilters.q}"
                <button
                  onClick={() => handleFilterChange('q', '')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.city && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                {localFilters.city}
                <button
                  onClick={() => handleFilterChange('city', undefined)}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.roomType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                {localFilters.roomType === 'PRIVATE' ? 'Privada' : 'Compartida'}
                <button
                  onClick={() => handleFilterChange('roomType', undefined)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(localFilters.minRent || localFilters.maxRent) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                ${localFilters.minRent || 0} - ${localFilters.maxRent || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('minRent', undefined)
                    handleFilterChange('maxRent', undefined)
                  }}
                  className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.availableFrom && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                Desde {new Date(localFilters.availableFrom).toLocaleDateString('es-AR')}
                <button
                  onClick={() => handleFilterChange('availableFrom', undefined)}
                  className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de filtros compactos para mobile
export function RoommateFiltersCompact({ 
  filters, 
  onFiltersChange, 
  loading = false 
}: RoommateFiltersProps) {
  
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="lg:hidden">
      {/* Botón toggle para mobile */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
      >
        <Filter className="w-5 h-5 mr-2" />
        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
      </button>

      {/* Filtros colapsables */}
      {showFilters && (
        <div className="mt-4">
          <RoommateFiltersComponent
            filters={filters}
            onFiltersChange={onFiltersChange}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}

// Hook personalizado para manejar filtros de roommates
export function useRoommateFilters(initialFilters: RoommateFilters = {}) {
  const [filters, setFilters] = useState<RoommateFilters>({
    order: 'recent',
    page: 1,
    limit: 12,
    ...initialFilters
  })

  const updateFilters = (newFilters: Partial<RoommateFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page cuando cambian filtros
    }))
  }

  const resetFilters = () => {
    setFilters({
      order: 'recent',
      page: 1,
      limit: 12
    })
  }

  const nextPage = () => {
    setFilters(prev => ({
      ...prev,
      page: (prev.page || 1) + 1
    }))
  }

  const prevPage = () => {
    setFilters(prev => ({
      ...prev,
      page: Math.max(1, (prev.page || 1) - 1)
    }))
  }

  return {
    filters,
    updateFilters,
    resetFilters,
    nextPage,
    prevPage,
    setFilters
  }
}

// Componente de paginación para roommates
interface RoommatePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
}

export function RoommatePagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  loading = false 
}: RoommatePaginationProps) {
  
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* Botón anterior */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || loading}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>

      {/* Números de página */}
      {getVisiblePages().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2 text-sm text-gray-500">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              disabled={loading}
              className={`px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Botón siguiente */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || loading}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    </div>
  )
}
