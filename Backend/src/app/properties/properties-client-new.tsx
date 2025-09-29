"use client"

import { useState, useEffect } from 'react'
import { FilterSectionWrapper } from '@/components/filter-section-wrapper'
import { PropertyGrid } from '@/components/property-grid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property, PropertyFilters } from '@/types/property'

export function PropertiesPageClient() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [currentFilters, setCurrentFilters] = useState<PropertyFilters>({})

  // Load properties on component mount
  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/properties')
      if (!response.ok) {
        throw new Error('Error al cargar las propiedades')
      }
      
      const data = await response.json()
      setProperties(data.properties || [])
      setFilteredProperties(data.properties || [])
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
      }
    ]
  }

  const handleFilterChange = (filters: PropertyFilters) => {
    setCurrentFilters(filters)

    // Apply filters locally for immediate UI response
    let filtered = [...properties]

    if (filters.city) {
      filtered = filtered.filter(p => 
        p.city.toLowerCase().includes(filters.city!.toLowerCase())
      )
    }

    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType)
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

    setFilteredProperties(filtered)
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
              <PropertyGrid initialProperties={filteredProperties} />
            ) : (
              <div className="space-y-6">
                {/* Simplified map view - avoid complex type issues */}
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-gray-600">Vista de mapa disponible próximamente</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {filteredProperties.length} propiedades encontradas
                    </p>
                  </div>
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
