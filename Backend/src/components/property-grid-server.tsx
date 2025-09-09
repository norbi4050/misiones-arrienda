"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property-card"
import { FilterSectionServer } from "@/components/filter-section-server"
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
        <FilterSectionServer 
          onFilterChange={handleFilterChange} 
          initialSearchParams={searchParams}
        />
        <div className="flex justify-center items-center py-12">
          <div className="text-lg">Cargando propiedades...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <FilterSectionServer 
        onFilterChange={handleFilterChange} 
        initialSearchParams={searchParams}
      />
      
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
            images={property.images}
            city={property.city}
            province={property.province}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            area={Number(property.area)}
          />
        ))}
      </div>
      
      {properties.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¡Sé el primero en publicar!
            </h3>
            <p className="text-gray-500 mb-6">
              Aún no hay propiedades publicadas. ¿Tienes una propiedad para alquilar o vender en Misiones?
            </p>
            <div className="space-y-3">
              <a
                href="/publicar"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Publicar mi propiedad
              </a>
              <div className="text-sm text-gray-400">
                Es gratis y toma solo unos minutos
              </div>
            </div>
          </div>
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
