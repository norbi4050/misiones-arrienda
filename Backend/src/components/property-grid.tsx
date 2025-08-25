"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property-card"
import { FilterSection } from "@/components/filter-section"
import { getProperties } from "@/lib/api"
import { Property, PropertyFilters } from "@/types/property"

export function PropertyGrid() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PropertyFilters>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  const fetchProperties = async (currentFilters: PropertyFilters = {}, page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await getProperties({ ...currentFilters, page, limit: pagination.limit })
      setProperties(response.properties)
      setPagination(response.pagination)
    } catch (err) {
      setError('Error al cargar las propiedades')
      console.error('Error fetching properties:', err)
      // Fallback to mock data if API fails
      setProperties([
        {
          id: "1",
          title: "Hermoso departamento en el centro",
          description: "Departamento moderno en el centro de la ciudad",
          price: 85000,
          bedrooms: 2,
          bathrooms: 1,
          garages: 0,
          area: 75,
          address: "Av. Corrientes 1234",
          city: "Posadas",
          province: "Misiones",
          postalCode: "3300",
          propertyType: "APARTMENT",
          listingType: "RENT",
          status: "AVAILABLE",
          images: ["/placeholder-apartment-1.jpg"],
          amenities: [],
          features: [],
          featured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          agent: {
            id: "1",
            name: "Juan Pérez",
            email: "juan@example.com",
            phone: "+54 376 123456",
            rating: 4.5
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const handleFilterChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters)
    fetchProperties(newFilters, 1)
  }

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchProperties(filters, pagination.page + 1)
    }
  }

  if (loading && properties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FilterSection onFilterChange={handleFilterChange} />
        <div className="flex justify-center items-center py-12">
          <div className="text-lg">Cargando propiedades...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <FilterSection onFilterChange={handleFilterChange} />
      
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error} - Mostrando datos de ejemplo
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {properties.map((property) => (
          <PropertyCard 
            key={property.id} 
            id={property.id}
            title={property.title}
            price={Number(property.price)}
            type={property.propertyType}
            location={`${property.city}, ${property.province}`}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            area={Number(property.area)}
            image={property.images[0] || "/placeholder-apartment-1.jpg"}
            featured={property.featured}
          />
        ))}
      </div>
      
      {properties.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron propiedades con los filtros seleccionados.</p>
        </div>
      )}
      
      {pagination.page < pagination.pages && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Cargar más propiedades'}
          </button>
        </div>
      )}
    </div>
  )
}
