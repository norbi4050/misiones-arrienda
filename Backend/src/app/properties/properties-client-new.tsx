"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterSectionWrapper } from '@/components/filter-section-wrapper'
import { PropertyGrid } from '@/components/property-grid'
import { PropertyMap } from '@/components/property-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property, PropertyFilters } from '@/types/property'
import { PropertiesMap } from '@/components/ui/PropertiesMap'
import { track } from '@/lib/analytics/track'

// Tipos para BBOX
interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

// Estado unificado para filtros y mapa
interface PropertiesState {
  filters: PropertyFilters;
  bbox: BBox | null;
  viewMode: 'grid' | 'map';
  properties: Property[];
  filteredProperties: Property[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

export function PropertiesPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estado unificado
  const [state, setState] = useState<PropertiesState>({
    filters: {},
    bbox: null,
    viewMode: 'grid',
    properties: [],
    filteredProperties: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    limit: 20
  })

  // Leer filtros de URL en SSR inicial
  useEffect(() => {
    const urlFilters: PropertyFilters = {}
    const urlBbox: BBox | null = null

    // Leer filtros de URL
    const bboxParam = searchParams.get('bbox')
    if (bboxParam) {
      const coords = bboxParam.split(',').map(c => parseFloat(c))
      if (coords.length === 4 && coords.every(c => !isNaN(c))) {
        urlFilters.bbox = {
          minLng: coords[0],
          minLat: coords[1],
          maxLng: coords[2],
          maxLat: coords[3]
        }
      }
    }

    const priceMin = searchParams.get('priceMin')
    if (priceMin) urlFilters.minPrice = parseInt(priceMin)

    const priceMax = searchParams.get('priceMax')
    if (priceMax) urlFilters.maxPrice = parseInt(priceMax)

    const rooms = searchParams.get('rooms')
    if (rooms) urlFilters.minBedrooms = parseInt(rooms)

    const type = searchParams.get('type')
    if (type) urlFilters.propertyType = type as any

    const featured = searchParams.get('featured')
    if (featured === 'true') urlFilters.featured = true

    const q = searchParams.get('q')
    if (q) urlFilters.city = q

    const sort = searchParams.get('sort')
    if (sort) urlFilters.sortBy = sort as any

    // Cargar propiedades con filtros iniciales
    loadProperties(urlFilters)
  }, [searchParams])

  // Actualizar URL cuando cambien filtros o bbox (debounced)
  const updateURL = useCallback((newFilters: PropertyFilters, newBbox: BBox | null) => {
    const params = new URLSearchParams()

    if (newBbox) {
      params.set('bbox', `${newBbox.minLng},${newBbox.minLat},${newBbox.maxLng},${newBbox.maxLat}`)
    }

    if (newFilters.minPrice) params.set('priceMin', newFilters.minPrice.toString())
    if (newFilters.maxPrice) params.set('priceMax', newFilters.maxPrice.toString())
    if (newFilters.minBedrooms) params.set('rooms', newFilters.minBedrooms.toString())
    if (newFilters.propertyType) params.set('type', newFilters.propertyType)
    if (newFilters.featured) params.set('featured', 'true')
    if (newFilters.city) params.set('q', newFilters.city)
    if (newFilters.sortBy) params.set('sort', newFilters.sortBy)

    const newURL = `/properties${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newURL, { scroll: false })
  }, [router])

  // Debounced URL update
  const debouncedUpdateURL = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (filters: PropertyFilters, bbox: BBox | null) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => updateURL(filters, bbox), 400)
      }
    })(),
    [updateURL]
  )

  const loadProperties = async (filters: PropertyFilters = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Construir query params
      const params = new URLSearchParams()

      if (filters.bbox) {
        params.set('bbox', `${filters.bbox.minLng},${filters.bbox.minLat},${filters.bbox.maxLng},${filters.bbox.maxLat}`)
      }
      if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
      if (filters.minBedrooms) params.set('minBedrooms', filters.minBedrooms.toString())
      if (filters.propertyType) params.set('propertyType', filters.propertyType)
      if (filters.featured) params.set('featured', 'true')
      if (filters.city) params.set('city', filters.city)
      if (filters.sortBy) params.set('sortBy', filters.sortBy)

      const response = await fetch(`/api/properties?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error al cargar las propiedades')
      }

      const data = await response.json()
      const properties = data.properties || []

      setState(prev => ({
        ...prev,
        properties,
        filteredProperties: properties,
        total: data.total || properties.length,
        loading: false
      }))

      // Analytics: bounds changed si hay bbox
      if (filters.bbox) {
        track('map_bounds_changed', {
          bbox: filters.bbox,
          zoom: 10, // estimado
          resultsCount: properties.length
        })
      }

    } catch (err) {
      console.error('Error loading properties:', err)
      setState(prev => ({
        ...prev,
        error: 'Error al cargar las propiedades. Por favor, intenta nuevamente.',
        loading: false
      }))

      // Fallback to mock data for development
      const mockProperties = generateMockProperties()
      setState(prev => ({
        ...prev,
        properties: mockProperties,
        filteredProperties: mockProperties,
        loading: false
      }))
    }
  }

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
    setState(prev => ({ ...prev, filters }))

    // Aplicar filtros localmente para UI inmediata
    let filtered = [...state.properties]

    if (filters.city) {
      filtered = filtered.filter(p => p.city.toLowerCase().includes(filters.city!.toLowerCase()))
    }

    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType)
    }

    if (filters.listingType) {
      filtered = filtered.filter(p => p.listingType === filters.listingType)
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!)
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!)
    }

    if (filters.minBedrooms !== undefined) {
      filtered = filtered.filter(p => p.bedrooms >= filters.minBedrooms!)
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter(p => p.featured === filters.featured)
    }

    setState(prev => ({ ...prev, filteredProperties: filtered }))

    // Actualizar URL con debounce
    debouncedUpdateURL(filters, state.bbox)
  }

  const handleBoundsChange = (bbox: BBox) => {
    setState(prev => ({ ...prev, bbox }))

    // Refetch con nuevo bbox
    const newFilters = { ...state.filters, bbox }
    loadProperties(newFilters)

    // Analytics
    track('map_bounds_changed', {
      bbox,
      zoom: 10, // estimado
      resultsCount: state.filteredProperties.length
    })
  }

  const handleMarkerClick = (property: Property) => {
    // Analytics
    track('map_marker_click', {
      propertyId: property.id
    })

    // Navegar a detalle
    router.push(`/properties/${property.id}`)
  }

  const toggleViewMode = (mode: 'grid' | 'map') => {
    setState(prev => ({ ...prev, viewMode: mode }))

    // Analytics
    track('map_toggle_maplist', {
      to: mode
    })
  }

  const getActiveFiltersCount = () => {
    return Object.values(state.filters).filter(value =>
      value !== undefined && value !== null && value !== ''
    ).length
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando propiedades...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <Button onClick={() => handleFilterChange({})}>
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
                {state.filteredProperties.length} propiedad{state.filteredProperties.length !== 1 ? 'es' : ''} encontrada{state.filteredProperties.length !== 1 ? 's' : ''}
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
                variant={state.viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => toggleViewMode('grid')}
                size="sm"
              >
                📋 Lista
              </Button>
              <Button
                variant={state.viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => toggleViewMode('map')}
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
        {state.filteredProperties.length === 0 ? (
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
                📊 {state.filteredProperties.length} resultado{state.filteredProperties.length !== 1 ? 's' : ''}
              </Badge>

              {state.filteredProperties.some(p => p.featured) && (
                <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                  ⭐ {state.filteredProperties.filter(p => p.featured).length} destacada{state.filteredProperties.filter(p => p.featured).length !== 1 ? 's' : ''}
                </Badge>
              )}

              <Badge variant="secondary" className="text-sm">
                💰 Desde ${Math.min(...state.filteredProperties.map(p => p.price)).toLocaleString()}
              </Badge>
            </div>

            {/* Content based on view mode */}
            {state.viewMode === 'grid' ? (
              <PropertyGrid initialProperties={state.filteredProperties} />
            ) : (
              <div className="space-y-6">
                <PropertiesMap
                  items={state.filteredProperties}
                  bbox={state.bbox}
                  onBoundsChange={handleBoundsChange}
                  onMarkerClick={handleMarkerClick}
                  className="rounded-lg shadow-lg"
                />

                {/* Properties list below map */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Propiedades en el mapa ({state.filteredProperties.length})
                  </h3>
                  <PropertyGrid initialProperties={state.filteredProperties} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
