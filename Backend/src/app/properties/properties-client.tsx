"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterSectionWrapper } from '@/components/filter-section-wrapper'
import { PropertyGrid } from '@/components/property-grid'
import { PropertyMap } from '@/components/property-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property, PropertyFilters } from '@/types/property'

export function PropertiesPageClient() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list') // aseguramos LISTA por defecto
  const [currentFilters, setCurrentFilters] = useState<PropertyFilters>({})

  // Load properties on component mount
  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/properties?sortBy=id&sortOrder=desc&limit=12')
      if (!response.ok) {
        throw new Error('Error al cargar las propiedades')
      }
      
      const data = await response.json()
      const arr = Array.isArray(data?.properties) ? data.properties : []
      console.log('PROPERTIES LEN:', arr.length, data)
      setProperties(arr)
      setFilteredProperties(arr)
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
    setCurrentFilters(filters)
    
    let filtered = [...properties]

    // Apply filters
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
    
    if (filters.minBathrooms !== undefined) {
      filtered = filtered.filter(p => p.bathrooms >= filters.minBathrooms!)
    }
    
    if (filters.featured !== undefined) {
      filtered = filtered.filter(p => p.featured === filters.featured)
    }

    setFilteredProperties(filtered)
  }

  const getActiveFiltersCount = () => {
    return Object.values(currentFilters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length
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
          <Button onClick={loadProperties}>
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

            {/* Content based on view mode - FORZAMOS LISTA */}
            {view === 'list' ? (
              <>
                {console.log('RENDERING LIST VIEW:', filteredProperties.length, 'properties')}
                <PropertyGrid properties={filteredProperties} />
              </>
            ) : (
              <div className="space-y-6">
                <PropertyMap
                  properties={filteredProperties}
                  height="600px"
                  onPropertyClick={(property) => {
                    window.location.href = `/property/${property.id}`
                  }}
                />

                {/* Properties list below map */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Propiedades en el mapa ({filteredProperties.length})
                  </h3>
                  <PropertyGrid properties={filteredProperties} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
