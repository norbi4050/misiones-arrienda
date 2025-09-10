"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterSectionWrapper } from '@/components/filter-section-wrapper'
import { PropertyGrid } from '@/components/property-grid'
import { PropertyMap } from '@/components/property-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property, PropertyFilters } from '@/types/property'
import Pagination from '@/components/ui/pagination'

export function PropertiesPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [currentFilters, setCurrentFilters] = useState<PropertyFilters>({})
  const [totalCount, setTotalCount] = useState(0)

  // Parse URL params to filters
  const parseUrlFilters = useCallback((): PropertyFilters => {
    const filters: PropertyFilters = {}

    const city = searchParams.get('city')
    if (city) filters.city = city

    const province = searchParams.get('province')
    if (province) filters.province = province

    const propertyType = searchParams.get('propertyType')
    if (propertyType && ['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO'].includes(propertyType)) {
      filters.propertyType = propertyType as Property['propertyType']
    }

    // Handle both priceMin/priceMax and minPrice/maxPrice for backward compatibility
    const priceMin = searchParams.get('priceMin') || searchParams.get('minPrice')
    if (priceMin && !isNaN(Number(priceMin))) filters.priceMin = Number(priceMin)

    const priceMax = searchParams.get('priceMax') || searchParams.get('maxPrice')
    if (priceMax && !isNaN(Number(priceMax))) filters.priceMax = Number(priceMax)

    // Handle both bedroomsMin and bedrooms for backward compatibility
    const bedroomsMin = searchParams.get('bedroomsMin') || searchParams.get('bedrooms')
    if (bedroomsMin && !isNaN(Number(bedroomsMin))) filters.bedroomsMin = Number(bedroomsMin)

    // Handle both bathroomsMin and bathrooms for backward compatibility
    const bathroomsMin = searchParams.get('bathroomsMin') || searchParams.get('bathrooms')
    if (bathroomsMin && !isNaN(Number(bathroomsMin))) filters.bathroomsMin = Number(bathroomsMin)

    // Handle both orderBy and sortBy for backward compatibility
    const orderBy = searchParams.get('orderBy') || searchParams.get('sortBy')
    if (orderBy && ['createdAt', 'price', 'id', 'bedrooms', 'bathrooms', 'area'].includes(orderBy)) {
      filters.orderBy = orderBy as 'createdAt' | 'price' | 'id' | 'bedrooms' | 'bathrooms' | 'area'
    }

    // Handle both order and sortOrder for backward compatibility
    const order = searchParams.get('order') || searchParams.get('sortOrder')
    if (order && ['asc', 'desc'].includes(order)) {
      filters.order = order as 'asc' | 'desc'
    }

    const minArea = searchParams.get('minArea')
    if (minArea && !isNaN(Number(minArea))) filters.minArea = Number(minArea)

    const maxArea = searchParams.get('maxArea')
    if (maxArea && !isNaN(Number(maxArea))) filters.maxArea = Number(maxArea)

    const amenities = searchParams.get('amenities')
    if (amenities) filters.amenities = amenities

    const limit = searchParams.get('limit')
    if (limit && !isNaN(Number(limit))) filters.limit = Number(limit)

    const offset = searchParams.get('offset')
    if (offset && !isNaN(Number(offset))) filters.offset = Number(offset)

    return filters
  }, [searchParams])

  // Load properties with current filters
  const loadProperties = useCallback(async (filters: PropertyFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      // Build query string with new API parameters
      const params = new URLSearchParams()

      if (filters.city) params.set('city', filters.city)
      if (filters.province) params.set('province', filters.province)
      if (filters.propertyType) params.set('propertyType', filters.propertyType)
      if (filters.priceMin !== undefined) params.set('priceMin', filters.priceMin.toString())
      if (filters.priceMax !== undefined) params.set('priceMax', filters.priceMax.toString())
      if (filters.bedroomsMin !== undefined) params.set('bedroomsMin', filters.bedroomsMin.toString())
      if (filters.bathroomsMin !== undefined) params.set('bathroomsMin', filters.bathroomsMin.toString())
      if (filters.minArea !== undefined) params.set('minArea', filters.minArea.toString())
      if (filters.maxArea !== undefined) params.set('maxArea', filters.maxArea.toString())
      if (filters.amenities) params.set('amenities', filters.amenities)
      if (filters.orderBy) params.set('orderBy', filters.orderBy)
      if (filters.order) params.set('order', filters.order)
      if (filters.limit !== undefined) params.set('limit', filters.limit.toString())
      if (filters.offset !== undefined) params.set('offset', filters.offset.toString())

      const queryString = params.toString()
      const url = `/api/properties${queryString ? `?${queryString}` : ''}`

      console.log('Loading properties with URL:', url)

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Error al cargar las propiedades')
      }

      const data = await response.json()
      const items = Array.isArray(data?.items) ? data.items : []
      const count = data?.count || 0

      console.log('Loaded properties:', items.length, 'total:', count)
      setProperties(items)
      setTotalCount(count)
    } catch (err) {
      console.error('Error loading properties:', err)
      setError('Error al cargar las propiedades. Por favor, intenta nuevamente.')

      // Fallback to mock data for development
      const mockProperties = generateMockProperties()
      setProperties(mockProperties)
      setTotalCount(mockProperties.length)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load properties when URL params change
  useEffect(() => {
    const filters = parseUrlFilters()
    setCurrentFilters(filters)
    loadProperties(filters)
  }, [parseUrlFilters, loadProperties])

  const generateMockProperties = (): Property[] => {
    return [
      {
        id: "1",
        title: "Casa moderna en Posadas Centro",
        description: "Hermosa casa de 3 dormitorios en el corazón de Posadas, con todas las comodidades modernas.",
        price: 120000,
        currency: "ARS",
        city: "Posadas",
        province: "Misiones",
        country: "Argentina",
        latitude: -27.3621,
        longitude: -55.9008,
        images: ["/placeholder-house-1.jpg", "/placeholder-house-2.jpg"],
        featured: true,
        bedrooms: 3,
        bathrooms: 2,
        garages: 1,
        area: 150,
        propertyType: "HOUSE",
        listingType: "SALE",
        status: "AVAILABLE",
        address: "Av. Mitre 1234",
        postalCode: "3300",
        yearBuilt: 2020,
        amenities: ["Piscina", "Jardín", "Parrilla", "Garage"],
        features: ["Cocina moderna", "Pisos de cerámica", "Aire acondicionado"],
        contact_phone: "+54 376 123456",
        isPaid: false,
        userId: "user1",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        agent: {
          id: "agent1",
          name: "Juan Pérez",
          phone: "+54 376 123456",
          email: "juan@example.com"
        }
      },
      {
        id: "2",
        title: "Departamento céntrico en Oberá",
        description: "Moderno departamento de 2 dormitorios en el centro de Oberá, ideal para parejas jóvenes.",
        price: 85000,
        currency: "ARS",
        city: "Oberá",
        province: "Misiones",
        country: "Argentina",
        latitude: -27.4878,
        longitude: -55.1199,
        images: ["/placeholder-apartment-1.jpg", "/placeholder-apartment-2.jpg"],
        featured: false,
        bedrooms: 2,
        bathrooms: 1,
        garages: 0,
        area: 80,
        propertyType: "APARTMENT",
        listingType: "SALE",
        status: "AVAILABLE",
        address: "San Martín 567",
        postalCode: "3360",
        yearBuilt: 2018,
        amenities: ["Portero", "Ascensor", "Balcón"],
        features: ["Cocina integrada", "Pisos flotantes"],
        contact_phone: "+54 376 654321",
        isPaid: false,
        userId: "user2",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        agent: {
          id: "agent2",
          name: "María García",
          phone: "+54 376 654321",
          email: "maria@example.com"
        }
      },
      {
        id: "3",
        title: "Local comercial en Puerto Iguazú",
        description: "Excelente local comercial en zona turística de Puerto Iguazú, ideal para negocio gastronómico.",
        price: 200000,
        currency: "ARS",
        city: "Puerto Iguazú",
        province: "Misiones",
        country: "Argentina",
        latitude: -25.5948,
        longitude: -54.5805,
        images: ["/placeholder-commercial-1.jpg"],
        featured: true,
        bedrooms: 0,
        bathrooms: 2,
        garages: 0,
        area: 120,
        propertyType: "COMMERCIAL",
        listingType: "RENT",
        status: "AVAILABLE",
        address: "Av. Brasil 890",
        postalCode: "3370",
        yearBuilt: 2015,
        amenities: ["Aire acondicionado", "Estacionamiento"],
        features: ["Vidriera amplia", "Depósito", "Baño completo"],
        contact_phone: "+54 376 789012",
        isPaid: false,
        userId: "user3",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        agent: {
          id: "agent3",
          name: "Carlos López",
          phone: "+54 376 789012",
          email: "carlos@example.com"
        }
      },
      {
        id: "4",
        title: "Terreno en Eldorado",
        description: "Amplio terreno de 1000m² en Eldorado, ideal para construcción de vivienda familiar.",
        price: 45000,
        currency: "ARS",
        city: "Eldorado",
        province: "Misiones",
        country: "Argentina",
        latitude: -26.4009,
        longitude: -54.6156,
        images: ["/placeholder-land-1.jpg"],
        featured: false,
        bedrooms: 0,
        bathrooms: 0,
        garages: 0,
        area: 1000,
        propertyType: "LAND",
        listingType: "SALE",
        status: "AVAILABLE",
        address: "Ruta 12 Km 45",
        postalCode: "3380",
        amenities: ["Luz", "Agua"],
        features: ["Esquina", "Arbolado"],
        contact_phone: "+54 376 345678",
        isPaid: false,
        userId: "user4",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        agent: {
          id: "agent4",
          name: "Ana Rodríguez",
          phone: "+54 376 345678",
          email: "ana@example.com"
        }
      }
    ]
  }

  const handleFilterChange = (filters: PropertyFilters) => {
    // Instead of filtering locally, update URL params to trigger reload
    const params = new URLSearchParams()

    if (filters.city) params.set('city', filters.city)
    if (filters.province) params.set('province', filters.province)
    if (filters.propertyType) params.set('propertyType', filters.propertyType)
    if (filters.priceMin !== undefined) params.set('priceMin', filters.priceMin.toString())
    if (filters.priceMax !== undefined) params.set('priceMax', filters.priceMax.toString())
    if (filters.bedroomsMin !== undefined) params.set('bedroomsMin', filters.bedroomsMin.toString())
    if (filters.bathroomsMin !== undefined) params.set('bathroomsMin', filters.bathroomsMin.toString())
    if (filters.minArea !== undefined) params.set('minArea', filters.minArea.toString())
    if (filters.maxArea !== undefined) params.set('maxArea', filters.maxArea.toString())
    if (filters.amenities) params.set('amenities', filters.amenities)
    if (filters.orderBy) params.set('orderBy', filters.orderBy)
    if (filters.order) params.set('order', filters.order)
    if (filters.limit !== undefined) params.set('limit', filters.limit.toString())
    if (filters.offset !== undefined) params.set('offset', filters.offset.toString())

    const newUrl = `/properties${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newUrl)
  }

  const getActiveFiltersCount = () => {
    return Object.values(currentFilters).filter(value =>
      value !== undefined && value !== null && value !== ''
    ).length
  }

  // Pagination calculations
  const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') ?? 12)))
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0))
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0

  // Update URL params helper
  const updateParams = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) params.delete(k)
      else params.set(k, String(v))
    })
    router.replace(`/properties?${params.toString()}`)
  }

  // Pagination handlers
  const onPageChange = (page: number) => {
    const safe = Math.max(1, page)
    const nextOffset = (safe - 1) * limit
    updateParams({ offset: nextOffset })
  }

  const onItemsPerPageChange = (n: number) => {
    const nextLimit = Math.max(1, Math.min(50, n))
    updateParams({ limit: nextLimit, offset: 0 }) // reset to page 1
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando propiedades...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadProperties()}>
            🔄 Intentar nuevamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Propiedades en Misiones
              </h1>
              <p className="text-gray-600">
                {properties.length} propiedad{properties.length !== 1 ? 'es' : ''} encontrada{properties.length !== 1 ? 's' : ''}
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2">
                    con {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} aplicado{getActiveFiltersCount() > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                onClick={() => setView('list')}
                size="sm"
              >
                📋 Lista
              </Button>
              <Button
                variant={view === 'map' ? 'default' : 'outline'}
                onClick={() => setView('map')}
                size="sm"
              >
                🗺️ Mapa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Section */}
      <FilterSectionWrapper
        onFilterChange={handleFilterChange}
        enableUrlPersistence={true}
        enableRealTimeFiltering={true}
      />

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No se encontraron propiedades
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta ajustar los filtros para encontrar más resultados
            </p>
            <Button onClick={() => handleFilterChange({})}>
              🔄 Limpiar todos los filtros
            </Button>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Badge variant="secondary" className="text-sm">
                📊 {properties.length} resultado{properties.length !== 1 ? 's' : ''}
              </Badge>

              {properties.some(p => p.featured) && (
                <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                  ⭐ {properties.filter(p => p.featured).length} destacada{properties.filter(p => p.featured).length !== 1 ? 's' : ''}
                </Badge>
              )}

              <Badge variant="secondary" className="text-sm">
                💰 Desde ${Math.min(...properties.map(p => p.price)).toLocaleString()}
              </Badge>
            </div>

            {/* Content based on view mode - FORZAMOS LISTA */}
            {view === 'list' ? (
              <>
                {console.log('RENDERING LIST VIEW:', properties.length, 'properties')}
                <PropertyGrid properties={properties} />
              </>
            ) : (
              <div className="space-y-6">
                <PropertyMap
                  properties={properties}
                  height="600px"
                  onPropertyClick={(property) => {
                    window.location.href = `/property/${property.id}`
                  }}
                />

                {/* Properties list below map */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Propiedades en el mapa ({properties.length})
                  </h3>
                  <PropertyGrid properties={properties} />
                </div>
              </div>
            )}
          </>
      )}
      </div>
      {/* Pagination Section */}
      {totalPages > 1 && (
        <div className="container mx-auto px-4 py-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            onPageChange={onPageChange}
            itemsPerPage={limit}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      )}
    </div>
  )
}
