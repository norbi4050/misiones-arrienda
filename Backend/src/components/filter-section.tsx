"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    province: "all",
    priceMin: "",
    priceMax: "",
    bedrooms: "all",
    bedroomsMin: "",
    bathrooms: "all",
    bathroomsMin: "",
    minArea: "",
    maxArea: "",
    amenities: "",
    orderBy: "createdAt",
    order: "desc",
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
      province: searchParams.get('province') || 'all',
      priceMin: searchParams.get('priceMin') || '',
      priceMax: searchParams.get('priceMax') || '',
      bedrooms: searchParams.get('bedrooms') || 'all',
      bedroomsMin: searchParams.get('bedroomsMin') || '',
      bathrooms: searchParams.get('bathrooms') || 'all',
      bathroomsMin: searchParams.get('bathroomsMin') || '',
      minArea: searchParams.get('minArea') || '',
      maxArea: searchParams.get('maxArea') || '',
      amenities: searchParams.get('amenities') || '',
      orderBy: searchParams.get('orderBy') || 'createdAt',
      order: searchParams.get('order') || 'desc',
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
      if (value !== 'all' && value !== '') {
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
          apiFilters.priceMin = 0
          apiFilters.priceMax = 50000
          break
        case "50000-100000":
          apiFilters.priceMin = 50000
          apiFilters.priceMax = 100000
          break
        case "100000-200000":
          apiFilters.priceMin = 100000
          apiFilters.priceMax = 200000
          break
        case "200000-300000":
          apiFilters.priceMin = 200000
          apiFilters.priceMax = 300000
          break
        case "300000+":
          apiFilters.priceMin = 300000
          break
      }
    }

    // Convert listing type filter
    if (filters.listingType !== "all") {
      switch (filters.listingType) {
        case "rent":
          apiFilters.listingType = "RENT"
          break
        case "sale":
          apiFilters.listingType = "SALE"
          break
        case "both":
          apiFilters.listingType = "BOTH"
          break
      }
    }

    // Convert location filter
    if (filters.location !== "all") {
      apiFilters.city = filters.location
    }

    // Convert province filter - Nuevo
    if (filters.province !== "all") {
      apiFilters.province = filters.province
    }

    // Convert price min/max filters - Nuevos
    if (filters.priceMin && filters.priceMin !== "") {
      apiFilters.priceMin = parseInt(filters.priceMin)
    }

    if (filters.priceMax && filters.priceMax !== "") {
      apiFilters.priceMax = parseInt(filters.priceMax)
    }

    // Convert bedrooms filter
    if (filters.bedrooms !== "all") {
      apiFilters.bedroomsMin = parseInt(filters.bedrooms)
    }

    // Convert bedroomsMin filter - Nuevo
    if (filters.bedroomsMin && filters.bedroomsMin !== "") {
      apiFilters.bedroomsMin = parseInt(filters.bedroomsMin)
    }

    // Convert bathrooms filter
    if (filters.bathrooms !== "all") {
      apiFilters.bathroomsMin = parseInt(filters.bathrooms)
    }

    // Convert bathroomsMin filter - Nuevo
    if (filters.bathroomsMin && filters.bathroomsMin !== "") {
      apiFilters.bathroomsMin = parseInt(filters.bathroomsMin)
    }

    // Convert featured filter
    if (filters.featured !== "all") {
      apiFilters.featured = filters.featured === "true"
    }

    // Convert orderBy and order filters - Nuevos
    if (filters.orderBy && filters.orderBy !== "createdAt") {
      apiFilters.orderBy = filters.orderBy as 'createdAt' | 'price' | 'id'
    }

    if (filters.order && filters.order !== "desc") {
      apiFilters.order = filters.order as 'asc' | 'desc'
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
      province: "all",
      priceMin: "",
      priceMax: "",
      bedrooms: "all",
      bedroomsMin: "",
      bathrooms: "all",
      bathroomsMin: "",
      minArea: "",
      maxArea: "",
      amenities: "",
      orderBy: "createdAt",
      order: "desc",
      featured: "all"
    }
    setFilters(clearedFilters)
    updateUrlParams(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    // Exclude sorting filters from count
    const filterKeys = ['type', 'listingType', 'price', 'location', 'province', 'priceMin', 'priceMax', 'bedrooms', 'bedroomsMin', 'bathrooms', 'bathroomsMin', 'minArea', 'maxArea', 'amenities', 'featured'];
    return Object.entries(filters).filter(([key, value]) => {
      if (!filterKeys.includes(key)) return false; // Exclude sorting filters
      if (value === "all" || value === "") return false;
      return true;
    }).length;
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

        {/* Filter Controls - Primera fila */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
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

          {/* Location (City) */}
          <Input
            placeholder="🏙️ Ciudad"
            value={filters.location === "all" ? "" : filters.location}
            onChange={(e) => updateFilter('location', e.target.value || "all")}
            className="h-10"
          />

          {/* Province - Nuevo filtro */}
          <Input
            placeholder="🗺️ Provincia"
            value={filters.province === "all" ? "" : filters.province}
            onChange={(e) => updateFilter('province', e.target.value || "all")}
            className="h-10"
          />

          {/* Price Min - Nuevo filtro */}
          <Input
            type="number"
            placeholder="💰 Precio mín"
            value={filters.priceMin}
            onChange={(e) => updateFilter('priceMin', e.target.value)}
            className="h-10"
          />

          {/* Price Max - Nuevo filtro */}
          <Input
            type="number"
            placeholder="💰 Precio máx"
            value={filters.priceMax}
            onChange={(e) => updateFilter('priceMax', e.target.value)}
            className="h-10"
          />

          {/* Bedrooms Min - Nuevo filtro */}
          <Input
            type="number"
            placeholder="🛏️ Dorm. mín"
            value={filters.bedroomsMin}
            onChange={(e) => updateFilter('bedroomsMin', e.target.value)}
            className="h-10"
            min="0"
            max="10"
          />

          {/* Bathrooms Min - Nuevo filtro */}
          <Input
            type="number"
            placeholder="🚿 Baños mín"
            value={filters.bathroomsMin}
            onChange={(e) => updateFilter('bathroomsMin', e.target.value)}
            className="h-10"
            min="0"
            max="10"
          />

          {/* Min Area - Nuevo filtro */}
          <Input
            type="number"
            placeholder="📐 Área mín (m²)"
            value={filters.minArea}
            onChange={(e) => updateFilter('minArea', e.target.value)}
            className="h-10"
            min="0"
          />

          {/* Max Area - Nuevo filtro */}
          <Input
            type="number"
            placeholder="📐 Área máx (m²)"
            value={filters.maxArea}
            onChange={(e) => updateFilter('maxArea', e.target.value)}
            className="h-10"
            min="0"
          />

          {/* Amenities - Nuevo filtro */}
          <Input
            placeholder="🏊‍♂️ Amenidades (ej: piscina, gimnasio)"
            value={filters.amenities}
            onChange={(e) => updateFilter('amenities', e.target.value)}
            className="h-10"
          />
        </div>

        {/* Filter Controls - Segunda fila */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {/* Order By - Nuevo filtro */}
          <Select value={filters.orderBy} onValueChange={(value) => updateFilter('orderBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">📅 Fecha</SelectItem>
              <SelectItem value="price">💰 Precio</SelectItem>
            </SelectContent>
          </Select>

          {/* Order - Nuevo filtro */}
          <Select value={filters.order} onValueChange={(value) => updateFilter('order', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Orden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">⬇️ Descendente</SelectItem>
              <SelectItem value="asc">⬆️ Ascendente</SelectItem>
            </SelectContent>
          </Select>

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

          {/* Clear Filters Button */}
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🗑️ Limpiar
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-600 font-medium">Filtros activos:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (value === "all" || value === "") return null
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
