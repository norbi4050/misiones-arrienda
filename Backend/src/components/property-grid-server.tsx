"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property-card"
import { getProperties } from "@/lib/api"
import { Property, PropertyFilters } from "@/types/property"

interface PropertyGridServerProps {
  initialProperties?: Property[]
  searchParams?: { [key: string]: string | string[] | undefined }
}

export function PropertyGridServer({ initialProperties = [], searchParams = {} }: PropertyGridServerProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [loading, setLoading] = useState(initialProperties.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PropertyFilters>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: initialProperties.length,
    pages: Math.ceil(initialProperties.length / 12)
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
      // Fallback to initial properties if available
      if (initialProperties.length > 0) {
        setProperties(initialProperties)
      } else {
        setProperties([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Solo fetch si no tenemos propiedades iniciales
    if (initialProperties.length === 0) {
      fetchProperties()
    }
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
        <div className="flex justify-center items-center py-12">
          <div className="text-lg">Cargando propiedades...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Propiedades renderizadas server-side para SEO */}
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
            image={(property as any)?.cover_url ?? (property as any)?.coverUrl ?? (property as any)?.image ?? property.images[0] ?? "/placeholder-apartment-1.jpg"}
            featured={property.featured}
          />
        ))}
      </div>
      
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
