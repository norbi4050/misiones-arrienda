"use client"

import { useState } from "react"
import { SmartSearch } from "@/components/smart-search"

export function HeroSection() {
  const [searchResults, setSearchResults] = useState<string>("")

  const handleSearch = (location: string) => {
    setSearchResults(location)
    // Aquí podrías redirigir a la página de resultados o filtrar propiedades
    console.log("Buscando propiedades en:", location)
    
    // Scroll a la sección de propiedades
    const propertiesSection = document.getElementById('propiedades')
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Encuentra tu propiedad ideal en Misiones
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Casas, departamentos y locales comerciales en alquiler y venta
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">🔍 Búsqueda Inteligente</h3>
              <p className="text-blue-100 text-sm">
                Escribe y obtén sugerencias automáticas de ciudades y barrios de Misiones
              </p>
            </div>
            
            <SmartSearch 
              onSearch={handleSearch}
              placeholder="Ej: Posadas, Oberá, Villa Cabello..."
              className="w-full"
            />
            
            {searchResults && (
              <div className="mt-4 p-3 bg-white/20 rounded-lg">
                <p className="text-sm">
                  🎯 Buscando propiedades en: <strong>{searchResults}</strong>
                </p>
              </div>
            )}
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-blue-200">Búsquedas populares:</span>
              {['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú'].map((city) => (
                <button
                  key={city}
                  onClick={() => handleSearch(city)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
