"use client"

import { useState } from 'react'
import { Property } from '@/types/property'

interface PropertyMapProps {
  properties: Property[]
  center?: [number, number]
  zoom?: number
  height?: string
  onPropertyClick?: (property: Property) => void
}

export function PropertyMap({
  properties,
  center = [-27.3621, -55.9008], // Posadas, Misiones coordinates
  zoom = 10,
  height = "400px",
  onPropertyClick
}: PropertyMapProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  // Filter properties that have coordinates
  const propertiesWithCoords = properties.filter(
    property => property.latitude && property.longitude
  )

  // Mock map for now - we'll implement the real map later
  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-green-50" style={{ height }}>
      <div className="h-full flex flex-col">
        {/* Map Header */}
        <div className="bg-white p-4 border-b">
          <h3 className="font-semibold text-gray-800">
            🗺️ Mapa Interactivo - {propertiesWithCoords.length} propiedades
          </h3>
          <p className="text-sm text-gray-600">
            Misiones, Argentina - Vista de propiedades disponibles
          </p>
        </div>

        {/* Mock Map Content */}
        <div className="flex-1 relative p-4">
          <div className="absolute inset-4 bg-white rounded-lg shadow-inner flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🏠</div>
              <p className="text-gray-600 mb-4">Mapa interactivo próximamente</p>
              <p className="text-sm text-gray-500">
                Se mostrará un mapa con {propertiesWithCoords.length} propiedades marcadas
              </p>
            </div>
          </div>

          {/* Property markers simulation */}
          <div className="absolute top-8 left-8 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            $85k
          </div>
          <div className="absolute top-16 right-12 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            $120k
          </div>
          <div className="absolute bottom-20 left-16 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            $95k
          </div>
          <div className="absolute bottom-12 right-8 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            $150k
          </div>
        </div>

        {/* Map Controls */}
        <div className="bg-white p-3 border-t flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors">
              🏠 Todas
            </button>
            <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors">
              ⭐ Destacadas
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Zoom: {zoom} | Centro: Posadas, Misiones
          </div>
        </div>
      </div>
    </div>
  )
}
