"use client"

import { useState, useEffect } from "react"
import { EnhancedSearchBar } from "@/components/enhanced-search-bar"
import { PropertyMap } from "@/components/property-map"

interface SearchFilters {
  location: string
  propertyType: string
  minPrice: string
  maxPrice: string
}

export function HeroSection() {
  const [searchResults, setSearchResults] = useState<SearchFilters | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Fix React Error #425: Hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSearch = (filters: SearchFilters) => {
    setSearchResults(filters)
    console.log("Buscando propiedades con filtros:", filters)
    
    // Fix React Error #423: Cannot read properties - only run on client
    if (isClient && typeof window !== 'undefined') {
      const propertiesSection = document.getElementById('propiedades')
      if (propertiesSection) {
        propertiesSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  // Empty properties array - will be populated from real API
  const mockProperties: any[] = []

  // Prevent hydration mismatch by not rendering client-specific content on server
  if (!isClient) {
    return (
      <section className="relative">
        {/* Simplified Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Encuentra tu propiedad ideal en Misiones
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                Casas, departamentos y locales comerciales en alquiler y venta
              </p>
            </div>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-6xl mx-auto">
              <EnhancedSearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>

        {/* Interactive Map Section */}
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                🗺️ Explora propiedades en el mapa
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Visualiza todas las propiedades disponibles en Misiones. 
                Haz clic en los marcadores para ver detalles de cada propiedad.
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Mapa interactivo próximamente
                </h3>
                <p className="text-gray-600">
                  Una vez que se publiquen propiedades, aparecerán marcadas en este mapa interactivo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative">
      {/* Simplified Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Encuentra tu propiedad ideal en Misiones
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Casas, departamentos y locales comerciales en alquiler y venta
            </p>
          </div>
          
          {/* Enhanced Search Bar */}
          <div className="max-w-6xl mx-auto">
            <EnhancedSearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Interactive Map Section */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              🗺️ Explora propiedades en el mapa
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Visualiza todas las propiedades disponibles en Misiones. 
              Haz clic en los marcadores para ver detalles de cada propiedad.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            {mockProperties.length > 0 ? (
              <PropertyMap 
                properties={mockProperties}
                height="500px"
                onPropertyClick={(property) => {
                  console.log("Clicked property:", property.title)
                  // Safe navigation - only on client
                  if (typeof window !== 'undefined') {
                    window.location.href = `/property/${property.id}`
                  }
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Mapa interactivo próximamente
                </h3>
                <p className="text-gray-600">
                  Una vez que se publiquen propiedades, aparecerán marcadas en este mapa interactivo
                </p>
              </div>
            )}
          </div>
          
          {/* Map Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Ubicaciones Precisas</h3>
              <p className="text-sm text-gray-600">
                Cada propiedad está marcada con su ubicación exacta en el mapa
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold text-gray-900 mb-2">Precios Visibles</h3>
              <p className="text-sm text-gray-600">
                Ve los precios directamente en el mapa sin necesidad de hacer clic
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Propiedades Destacadas</h3>
              <p className="text-sm text-gray-600">
                Las propiedades destacadas se resaltan con colores especiales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Display - Only show on client */}
      {searchResults && (
        <div className="bg-blue-50 py-4">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-blue-800">
                🎯 Búsqueda activa: {searchResults.location && `📍 ${searchResults.location}`}
                {searchResults.propertyType && ` 🏠 ${searchResults.propertyType}`}
                {searchResults.minPrice && ` 💰 Desde $${parseInt(searchResults.minPrice).toLocaleString()}`}
                {searchResults.maxPrice && ` 💎 Hasta $${parseInt(searchResults.maxPrice).toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
