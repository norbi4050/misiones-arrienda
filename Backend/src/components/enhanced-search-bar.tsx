"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchFilters {
  location: string
  propertyType: string
  minPrice: string
  maxPrice: string
}

interface EnhancedSearchBarProps {
  onSearch: (filters: SearchFilters) => void
  className?: string
}

export function EnhancedSearchBar({ onSearch, className = "" }: EnhancedSearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    propertyType: "",
    minPrice: "",
    maxPrice: ""
  })

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleLocationChange = (value: string) => {
    setFilters(prev => ({ ...prev, location: value }))
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Location Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            📍 Ciudad / Barrio
          </label>
          <Select value={filters.location} onValueChange={handleLocationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ubicaciones</SelectItem>
              <SelectItem value="Posadas">🏙️ Posadas</SelectItem>
              <SelectItem value="Oberá">🌳 Oberá</SelectItem>
              <SelectItem value="Eldorado">🌿 Eldorado</SelectItem>
              <SelectItem value="Puerto Iguazú">🌊 Puerto Iguazú</SelectItem>
              <SelectItem value="Apóstoles">⛪ Apóstoles</SelectItem>
              <SelectItem value="Leandro N. Alem">🏘️ Leandro N. Alem</SelectItem>
              <SelectItem value="Montecarlo">🎰 Montecarlo</SelectItem>
              <SelectItem value="Puerto Rico">🏖️ Puerto Rico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            🏠 Tipo de Propiedad
          </label>
          <Select 
            value={filters.propertyType} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, propertyType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de propiedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="HOUSE">🏡 Casa</SelectItem>
              <SelectItem value="APARTMENT">🏢 Departamento</SelectItem>
              <SelectItem value="COMMERCIAL">🏪 Local Comercial</SelectItem>
              <SelectItem value="LAND">🌾 Terreno</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Price */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            💰 Precio Mínimo
          </label>
          <Select 
            value={filters.minPrice} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, minPrice: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Precio mín." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sin mínimo</SelectItem>
              <SelectItem value="50000">$50,000</SelectItem>
              <SelectItem value="100000">$100,000</SelectItem>
              <SelectItem value="150000">$150,000</SelectItem>
              <SelectItem value="200000">$200,000</SelectItem>
              <SelectItem value="300000">$300,000</SelectItem>
              <SelectItem value="500000">$500,000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Price */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            💎 Precio Máximo
          </label>
          <Select 
            value={filters.maxPrice} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, maxPrice: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Precio máx." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="999999999">Sin máximo</SelectItem>
              <SelectItem value="100000">$100,000</SelectItem>
              <SelectItem value="200000">$200,000</SelectItem>
              <SelectItem value="300000">$300,000</SelectItem>
              <SelectItem value="500000">$500,000</SelectItem>
              <SelectItem value="750000">$750,000</SelectItem>
              <SelectItem value="1000000">$1,000,000</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Button 
          onClick={handleSearch}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          size="lg"
        >
          🔍 Buscar Propiedades
        </Button>
        
        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-gray-500">Búsquedas rápidas:</span>
          <button
            onClick={() => {
              setFilters({ location: "Posadas", propertyType: "HOUSE", minPrice: "", maxPrice: "200000" })
              onSearch({ location: "Posadas", propertyType: "HOUSE", minPrice: "", maxPrice: "200000" })
            }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Casas en Posadas
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => {
              setFilters({ location: "Oberá", propertyType: "APARTMENT", minPrice: "", maxPrice: "150000" })
              onSearch({ location: "Oberá", propertyType: "APARTMENT", minPrice: "", maxPrice: "150000" })
            }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Deptos en Oberá
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => {
              setFilters({ location: "Puerto Iguazú", propertyType: "", minPrice: "", maxPrice: "" })
              onSearch({ location: "Puerto Iguazú", propertyType: "", minPrice: "", maxPrice: "" })
            }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Puerto Iguazú
          </button>
        </div>
      </div>

      {/* Active filters display */}
      {(filters.location || filters.propertyType || filters.minPrice || filters.maxPrice) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-blue-700 font-medium">Filtros activos:</span>
            {filters.location && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                📍 {filters.location}
              </span>
            )}
            {filters.propertyType && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                🏠 {filters.propertyType === 'HOUSE' ? 'Casa' : 
                     filters.propertyType === 'APARTMENT' ? 'Departamento' :
                     filters.propertyType === 'COMMERCIAL' ? 'Local' : 'Terreno'}
              </span>
            )}
            {filters.minPrice && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                💰 Desde ${parseInt(filters.minPrice).toLocaleString()}
              </span>
            )}
            {filters.maxPrice && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                💎 Hasta ${parseInt(filters.maxPrice).toLocaleString()}
              </span>
            )}
            <button
              onClick={() => {
                setFilters({ location: "", propertyType: "", minPrice: "", maxPrice: "" })
                onSearch({ location: "", propertyType: "", minPrice: "", maxPrice: "" })
              }}
              className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200 transition-colors"
            >
              ✕ Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
