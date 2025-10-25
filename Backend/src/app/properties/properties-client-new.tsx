"use client"

import { useState, useEffect } from 'react'
import { FilterSectionWrapper } from '@/components/filter-section-wrapper'
import { PropertyGrid } from '@/components/property-grid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property, PropertyFilters } from '@/types/property'
import { useBboxSync, BboxCoords } from '@/hooks/useBboxSync'
import dynamic from 'next/dynamic'

// Importación dinámica del mapa para evitar problemas de SSR
const PropertiesMap = dynamic(
  () => import('@/components/ui/PropertiesMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }
)

interface PropertiesPageClientProps {
  isAuthenticated?: boolean
  userId?: string
}

export function PropertiesPageClient({
  isAuthenticated = false,
  userId
}: PropertiesPageClientProps = {}) {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [currentFilters, setCurrentFilters] = useState<PropertyFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  // Hook para sincronizar bbox con URL
  const { bbox, updateBbox, clearBbox } = useBboxSync()

  // Load properties on component mount and when bbox changes
  useEffect(() => {
    setCurrentPage(1)
    loadProperties(1, false)
  }, [bbox])

  // Reload properties when filters change
  useEffect(() => {
    setCurrentPage(1)
    loadProperties(1, false)
  }, [currentFilters])

  const loadProperties = async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir URL con filtros y bbox
      const params = new URLSearchParams()
      
      // ✅ AGREGAR: Paginación
      params.set('page', page.toString())
      params.set('limit', '12')
      
      // Agregar bbox si existe
      if (bbox) {
        const bboxString = `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`
        params.set('bbox', bboxString)
      }
      
      // Agregar otros filtros
      if (currentFilters.city) params.set('city', currentFilters.city)
      if (currentFilters.propertyType) params.set('type', currentFilters.propertyType)
      if (currentFilters.operationType) params.set('operation_type', currentFilters.operationType)
      if (currentFilters.minPrice) params.set('minPrice', currentFilters.minPrice.toString())
      if (currentFilters.maxPrice) params.set('maxPrice', currentFilters.maxPrice.toString())
      if (currentFilters.minBedrooms) params.set('bedrooms', currentFilters.minBedrooms.toString())
      if (currentFilters.featured !== undefined) params.set('featured', currentFilters.featured.toString())
      
      const url = `/api/properties${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar las propiedades')
      }
      
      const data = await response.json()

      // DEBUG: Log para verificar qué datos recibimos
      console.log('[PropertiesClient] API Response:', {
        count: data.properties?.length,
        source: data.meta?.dataSource,
        firstProperty: data.properties?.[0],
        images: data.properties?.[0]?.images
      })

      // ✅ FIX: Append o replace según el caso
      if (append) {
        setProperties(prev => [...prev, ...(data.properties || [])])
        setFilteredProperties(prev => [...prev, ...(data.properties || [])])
      } else {
        setProperties(data.properties || [])
        setFilteredProperties(data.properties || [])
      }
      
      setCurrentPage(page)
      setHasMore(data.pagination && page < data.pagination.totalPages)
    } catch (err) {
      console.error('Error loading properties:', err)
      setError('Error al cargar las propiedades. Por favor, intenta nuevamente.')
      
      // Fallback to mock data for development
      const mockProperties = generateMockProperties()
      setProperties(mockProperties)
      setFilteredProperties(mockProperties)
    } finally {
      setLoading(false)
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
        latitude: -27.3621,
        longitude: -55.9008,
        images: ["/placeholder-house-1.jpg", "/placeholder-house-2.jpg"],
        featured: true,
        bedrooms: 3,
        bathrooms: 2,
        garages: 1,
        area: 150,
        propertyType: "HOUSE",
        operationType: "venta",
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
        latitude: -27.4878,
        longitude: -55.1199,
        images: ["/placeholder-apartment-1.jpg", "/placeholder-apartment-2.jpg"],
        featured: false,
        bedrooms: 2,
        bathrooms: 1,
        garages: 0,
        area: 80,
        propertyType: "APARTMENT",
        operationType: "venta",
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
      }
    ]
  }

  const handleFilterChange = (filters: PropertyFilters) => {
    setCurrentFilters(filters)
    // El useEffect se encargará de recargar las propiedades cuando currentFilters cambie
  }

  // ✅ AGREGAR: Handler para "Cargar más"
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProperties(currentPage + 1, true)
    }
  }

  // Handler para cuando cambian los bounds del mapa
  const handleBoundsChange = (newBbox: BboxCoords) => {
    updateBbox(newBbox)
    // loadProperties se ejecutará automáticamente por el useEffect
  }

  // Preparar propiedades para el mapa (solo las que tienen coordenadas)
  const propertiesWithCoords = filteredProperties.filter(
    p => p.latitude != null && p.longitude != null
  ).map(p => ({
    id: p.id,
    title: p.title,
    price: p.price,
    currency: p.currency,
    lat: p.latitude!,
    lng: p.longitude!,
    propertyType: p.propertyType,
    bedrooms: p.bedrooms,
    city: p.city,
    featured: p.featured
  }))

  if (loading && properties.length === 0) {
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
          <Button onClick={() => loadProperties(1, false)}>
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
                {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? 'es' : ''} encontrada{filteredProperties.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                size="sm"
              >
                📋 Lista
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
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
        {filteredProperties.length === 0 ? (
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
                📊 {filteredProperties.length} resultado{filteredProperties.length !== 1 ? 's' : ''}
              </Badge>

              {filteredProperties.some(p => p.featured) && (
                <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                  ⭐ {filteredProperties.filter(p => p.featured).length} destacada{filteredProperties.filter(p => p.featured).length !== 1 ? 's' : ''}
                </Badge>
              )}

              <Badge variant="secondary" className="text-sm">
                💰 Desde ${Math.min(...filteredProperties.map(p => p.price)).toLocaleString()}
              </Badge>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'grid' ? (
              <>
                <PropertyGrid initialProperties={filteredProperties} />
                
                {/* ✅ AGREGAR: Botón "Cargar más" */}
                {hasMore && !loading && filteredProperties.length > 0 && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      variant="outline"
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Cargando...
                        </>
                      ) : (
                        <>
                          📄 Cargar más propiedades
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                {/* Mapa con sincronización de bbox */}
                <div className="relative">
                  <PropertiesMap
                    items={propertiesWithCoords}
                    bbox={bbox}
                    onBoundsChange={handleBoundsChange}
                    className="h-96"
                  />
                  
                  {/* Botón para limpiar bbox */}
                  {bbox && (
                    <div className="absolute top-4 left-4 z-[1000]">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          clearBbox()
                          loadProperties(1, false)
                        }}
                        className="bg-white shadow-lg hover:bg-gray-100"
                      >
                        🔄 Ver todas las propiedades
                      </Button>
                    </div>
                  )}
                  
                  {/* Indicador de propiedades sin coordenadas */}
                  {filteredProperties.length > propertiesWithCoords.length && (
                    <div className="mt-2 text-sm text-gray-600 text-center">
                      ℹ️ {filteredProperties.length - propertiesWithCoords.length} propiedad(es) sin ubicación en el mapa
                    </div>
                  )}
                </div>

                {/* Properties list below map */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Propiedades en el área ({filteredProperties.length})
                  </h3>
                  <PropertyGrid initialProperties={filteredProperties} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
