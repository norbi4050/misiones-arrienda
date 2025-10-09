'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'

interface PropertyLocationMapProps {
  lat: number
  lng: number
  className?: string
}

const PropertyLocationMap: React.FC<PropertyLocationMapProps> = ({
  lat,
  lng,
  className = ""
}) => {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Leaflet dynamically to avoid SSR issues
  useEffect(() => {
    let mounted = true

    const loadLeaflet = async () => {
      try {
        // Import Leaflet
        const L = await import('leaflet')
        
        // Import CSS dynamically to avoid SSR issues
        if (typeof window !== 'undefined') {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
          document.head.appendChild(link)
        }

        if (!mounted) return

        // Configure default Leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        // Initialize map
        const mapContainer = document.getElementById('property-location-map')
        if (!mapContainer) return

        // Create map centered on property location with zoom 14
        const map = L.map(mapContainer, {
          center: [lat, lng],
          zoom: 14,
          // Disable interaction for read-only behavior
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomControl: false, // Hide zoom controls
          attributionControl: true // Keep attribution for legal reasons
        })

        // Add tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map)

        // Add single marker for the property
        const marker = L.marker([lat, lng], {
          // Custom icon for property marker
          icon: L.divIcon({
            html: `<div class="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">🏠</div>`,
            className: 'property-location-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(map)

        // Disable marker interaction
        marker.off('click')
        marker.off('mouseover')
        marker.off('mouseout')

        mapRef.current = map
        markerRef.current = marker
        setIsLoaded(true)

      } catch (err) {
        console.error('Error loading Leaflet:', err)
        if (mounted) {
          setError('Error cargando el mapa. Por favor, recarga la página.')
        }
      }
    }

    loadLeaflet()

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng])

  if (error) {
    return (
      <div className={`flex items-center justify-center h-72 bg-gray-100 rounded-xl ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error en el Mapa</h3>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center h-72 bg-gray-100 rounded-xl ${className}`}>
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        id="property-location-map" 
        className="h-72 w-full rounded-xl overflow-hidden border shadow-sm"
        style={{ minHeight: '288px' }}
      />
      
      {/* Read-only indicator */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center text-xs text-gray-600">
          <MapPin className="h-3 w-3 mr-1" />
          <span>Solo lectura</span>
        </div>
      </div>
    </div>
  )
}

export default PropertyLocationMap
