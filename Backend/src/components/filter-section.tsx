"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PropertyFilters } from "@/types/property"

interface FilterSectionProps {
  onFilterChange?: (filters: PropertyFilters) => void
  enableUrlPersistence?: boolean
  enableRealTimeFiltering?: boolean
}

export function FilterSection({ 
  onFilterChange, 
  enableUrlPersistence = true,
  enableRealTimeFiltering = true 
}: FilterSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    type: "all",
    listingType: "all",
    price: "all",
    location: "all",
    bedrooms: "all",
    bathrooms: "all",
    featured: "all"
  })

  // Load filters from URL on component mount
  useEffect(() => {
    if (!enableUrlPersistence) return

    const urlFilters = {
      type: searchParams.get('type') || 'all',
      listingType: searchParams.get('listingType') || 'all',
      price: searchParams.get('price') || 'all',
      location: searchParams.get('city') || 'all',
      bedrooms: searchParams.get('bedrooms') || 'all',
      bathrooms: searchParams.get('bathrooms') || 'all',
      featured: searchParams.get('featured') || 'all'
    }
    
    setFilters(urlFilters)
  }, [searchParams, enableUrlPersistence])

  // Real-time filtering effect
  useEffect(() => {
    if (enableRealTimeFiltering) {
      handleFilterChange()
    }
  }, [filters, enableRealTimeFiltering])

  const updateUrlParams = (newFilters: typeof filters) => {
    if (!enableUrlPersistence) return

    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== 'all') {
        // Map internal keys to URL-friendly keys
        const urlKey = key === 'location' ? 'city' : key
        params.set(urlKey, value)
      }
    })

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newUrl, { scroll: false })
  }

  const handleFilterChange = () => {
    if (!onFilterChange) return

    const apiFilters: PropertyFilters = {}

    // Convert type filter
    if (filters.type !== "all") {
      switch (filters.type) {
        case "house":
          apiFilters.propertyType = "HOUSE"
          break
        case "apartment":
          apiFilters.propertyType = "APARTMENT"
          break
        case "commercial":
          apiFilters.propertyType = "COMMERCIAL"
          break
        case "land":
          apiFilters.propertyType = "LAND"
          break
      }
    }

    // Convert price filter
    if (filters.price !== "all") {
      switch (filters.price) {
        case "0-50000":
          apiFilters.minPrice = 0
          apiFilters.maxPrice = 50000
          break
        case "50000-100000":
          apiFilters.minPrice = 50000
          apiFilters.maxPrice = 100000
          break
        case "100000-200000":
          apiFilters.minPrice = 100000
          apiFilters.maxPrice = 200000
          break
        case "200000-300000":
          apiFilters.minPrice = 200000
          apiFilters.maxPrice = 300000
          break
        case "300000+":
          apiFilters.minPrice = 300000
          break
      }
    }

    // Convert listing type filter (operationType)
    if (filters.listingType !== "all") {
      switch (filters.listingType) {
        case "rent":
          apiFilters.operationType = "alquiler"
          break
        case "sale":
          apiFilters.operationType = "venta"
          break
        case "both":
          apiFilters.operationType = "ambos"
          break
      }
    }

    // Convert location filter
    if (filters.location !== "all") {
      apiFilters.city = filters.location
    }

    // Convert bedrooms filter
    if (filters.bedrooms !== "all") {
      apiFilters.minBedrooms = parseInt(filters.bedrooms)
    }

    // Convert bathrooms filter
    if (filters.bathrooms !== "all") {
      apiFilters.minBathrooms = parseInt(filters.bathrooms)
    }

    // Convert featured filter
    if (filters.featured !== "all") {
      apiFilters.featured = filters.featured === "true"
    }

    onFilterChange(apiFilters)
  }

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateUrlParams(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      type: "all",
      listingType: "all",
      price: "all",
      location: "all",
      bedrooms: "all",
      bathrooms: "all",
      featured: "all"
    }
    setFilters(clearedFilters)
    updateUrlParams(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== "all").length
  }

  const getFilterLabel = (key: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      type: {
        house: "🏡 Casa",
        apartment: "🏢 Departamento", 
        commercial: "🏪 Local",
        land: "🌾 Terreno"
      },
      listingType: {
        rent: "🏠 Alquiler",
        sale: "💰 Venta",
        both: "🔄 Ambos"
      },
      location: {
        Posadas: "📍 Posadas",
        Eldorado: "📍 Eldorado",
        Oberá: "📍 Oberá",
        Apóstoles: "📍 Apóstoles",
        "Puerto Iguazú": "📍 Puerto Iguazú",
        "Leandro N. Alem": "📍 L.N. Alem",
        Montecarlo: "📍 Montecarlo",
        "Puerto Rico": "📍 Puerto Rico"
      },
      bedrooms: {
        "1": "🛏️ 1+ hab",
        "2": "🛏️ 2+ hab",
        "3": "🛏️ 3+ hab",
        "4": "🛏️ 4+ hab"
      },
      bathrooms: {
        "1": "🚿 1+ baño",
        "2": "🚿 2+ baños",
        "3": "🚿 3+ baños"
      },
      featured: {
        "true": "⭐ Destacadas"
      }
    }
    
    return labels[key]?.[value] || value
  }

  return (
    <section className="py-8 bg-white border-b">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Filtrar propiedades
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} activo{getActiveFiltersCount() > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <p className="text-gray-600">Encuentra exactamente lo que buscas</p>
          </div>
          
          {getActiveFiltersCount() > 0 && (
            <Button 
              variant="outline" 
              onClick={clearAllFilters}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              ❌ Limpiar filtros
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
          {/* Listing Type */}
          <Select value={filters.listingType} onValueChange={(value) => updateFilter('listingType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Alquiler/Venta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alquiler y Venta</SelectItem>
              <SelectItem value="rent">🏠 Solo Alquiler</SelectItem>
              <SelectItem value="sale">💰 Solo Venta</SelectItem>
              <SelectItem value="both">🔄 Ambos</SelectItem>
            </SelectContent>
          </Select>

          {/* Property Type */}
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="house">🏡 Casa</SelectItem>
              <SelectItem value="apartment">🏢 Departamento</SelectItem>
              <SelectItem value="commercial">🏪 Local comercial</SelectItem>
              <SelectItem value="land">🌾 Terreno</SelectItem>
            </SelectContent>
          </Select>

          {/* Location */}
          <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              <SelectItem value="Posadas">📍 Posadas</SelectItem>
              <SelectItem value="Oberá">📍 Oberá</SelectItem>
              <SelectItem value="Eldorado">📍 Eldorado</SelectItem>
              <SelectItem value="Puerto Iguazú">📍 Puerto Iguazú</SelectItem>
              <SelectItem value="Apóstoles">📍 Apóstoles</SelectItem>
              <SelectItem value="Leandro N. Alem">📍 L.N. Alem</SelectItem>
              <SelectItem value="Montecarlo">📍 Montecarlo</SelectItem>
              <SelectItem value="Puerto Rico">📍 Puerto Rico</SelectItem>
            </SelectContent>
          </Select>

          {/* Price Range */}
          <Select value={filters.price} onValueChange={(value) => updateFilter('price', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Precio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los precios</SelectItem>
              <SelectItem value="0-50000">💰 $0 - $50k</SelectItem>
              <SelectItem value="50000-100000">💰 $50k - $100k</SelectItem>
              <SelectItem value="100000-200000">💰 $100k - $200k</SelectItem>
              <SelectItem value="200000-300000">💰 $200k - $300k</SelectItem>
              <SelectItem value="300000+">💰 $300k+</SelectItem>
            </SelectContent>
          </Select>

          {/* Bedrooms */}
          <Select value={filters.bedrooms} onValueChange={(value) => updateFilter('bedrooms', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Dormitorios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier cantidad</SelectItem>
              <SelectItem value="1">🛏️ 1+ dormitorio</SelectItem>
              <SelectItem value="2">🛏️ 2+ dormitorios</SelectItem>
              <SelectItem value="3">🛏️ 3+ dormitorios</SelectItem>
              <SelectItem value="4">🛏️ 4+ dormitorios</SelectItem>
            </SelectContent>
          </Select>

          {/* Bathrooms */}
          <Select value={filters.bathrooms} onValueChange={(value) => updateFilter('bathrooms', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Baños" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier cantidad</SelectItem>
              <SelectItem value="1">🚿 1+ baño</SelectItem>
              <SelectItem value="2">🚿 2+ baños</SelectItem>
              <SelectItem value="3">🚿 3+ baños</SelectItem>
            </SelectContent>
          </Select>

          {/* Featured */}
          <Select value={filters.featured} onValueChange={(value) => updateFilter('featured', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Destacadas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="true">⭐ Solo destacadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-600 font-medium">Filtros activos:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (value === "all") return null
              return (
                <Badge 
                  key={`${key}-${value}`} 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                  onClick={() => updateFilter(key, "all")}
                >
                  {getFilterLabel(key, value)} ✕
                </Badge>
              )
            })}
          </div>
        )}

        {/* Manual Filter Button (for non-real-time mode) */}
        {!enableRealTimeFiltering && (
          <div className="flex justify-center">
            <Button onClick={handleFilterChange} size="lg" className="px-8">
              🔍 Aplicar Filtros
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
