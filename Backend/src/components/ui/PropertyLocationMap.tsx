'use client'

import { MapPin, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PropertyLocationMapProps {
  property: {
    title: string
    address: string
    city: string
    latitude?: number | string
    longitude?: number | string
    price: number
    currency?: string
  }
  height?: string
  className?: string
}

export default function PropertyLocationMap({ 
  property, 
  height = "300px",
  className = ""
}: PropertyLocationMapProps) {
  const lat = property.latitude ? parseFloat(property.latitude.toString()) : null
  const lng = property.longitude ? parseFloat(property.longitude.toString()) : null
  
  const hasValidCoords = lat && lng && !isNaN(lat) && !isNaN(lng)

  // Si no hay coordenadas válidas, mostrar fallback
  if (!hasValidCoords) {
    return (
      <div className={`w-full rounded-lg overflow-hidden bg-gray-100 ${className}`} style={{ height }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">Ubicación no verificada</h3>
            <p className="text-sm text-gray-600 mb-4">
              Las coordenadas exactas no están disponibles para esta propiedad
            </p>
            <div className="flex items-center justify-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">{property.address}, {property.city}</span>
            </div>
            <Badge variant="secondary" className="mt-3">
              Ubicación aproximada
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  // Generar URL de Google Maps estático (no requiere API key para vista básica)
  const googleMapsStaticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}&maptype=roadmap&format=png`
  
  // URL para abrir en Google Maps
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15`

  return (
    <div className={`w-full rounded-lg overflow-hidden shadow-sm bg-white ${className}`} style={{ height }}>
      <div className="h-full flex flex-col">
        {/* Map Header */}
        <div className="bg-white p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Ubicación
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {property.address}, {property.city}
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              ✓ Verificada
            </Badge>
          </div>
        </div>
        
        {/* Map Content */}
        <div className="flex-1 relative">
          {/* Mapa estático de Google Maps */}
          <div 
            className="w-full h-full bg-cover bg-center relative group cursor-pointer"
            style={{
              backgroundImage: `url(${googleMapsStaticUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            onClick={() => window.open(googleMapsUrl, '_blank')}
          >
            {/* Overlay con información */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
              {/* Marcador de precio */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
                  {property.currency || 'ARS'} {property.price.toLocaleString()}
                </div>
              </div>
              
              {/* Botón para abrir en Google Maps */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="bg-white text-gray-700 shadow-lg">
                  Ver en Google Maps →
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Fallback si Google Maps no carga */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click para ver en Google Maps</p>
            </div>
          </div>
        </div>
        
        {/* Map Footer */}
        <div className="bg-gray-50 p-3 border-t">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Lat: {lat?.toFixed(6)}, Lng: {lng?.toFixed(6)}</span>
            <span>Misiones, Argentina</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente alternativo sin Google Maps (solo coordenadas)
export function PropertyLocationSimple({ 
  property, 
  className = "" 
}: Omit<PropertyLocationMapProps, 'height'>) {
  const lat = property.latitude ? parseFloat(property.latitude.toString()) : null
  const lng = property.longitude ? parseFloat(property.longitude.toString()) : null
  
  const hasValidCoords = lat && lng && !isNaN(lat) && !isNaN(lng)

  return (
    <div className={`bg-white rounded-lg p-4 border ${className}`}>
      <div className="flex items-start space-x-3">
        <MapPin className="h-5 w-5 text-blue-600 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">Ubicación</h3>
          <p className="text-sm text-gray-600 mb-2">
            {property.address}, {property.city}
          </p>
          
          {hasValidCoords ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Lat: {lat?.toFixed(6)}</span>
                <span>Lng: {lng?.toFixed(6)}</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}&z=15`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                Ver en Google Maps →
              </a>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600">Coordenadas no disponibles</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
