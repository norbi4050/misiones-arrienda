'use client'

import { useEffect, useRef, useState } from 'react'
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
  // ✅ Validación robusta de coordenadas
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className={`flex items-center justify-center h-72 bg-gray-100 rounded-xl ${className}`}>
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ubicación no disponible</h3>
          <p className="text-gray-600 text-sm">Las coordenadas de esta propiedad no son válidas</p>
        </div>
      </div>
    )
  }

  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const L = await import('leaflet')

        // ✅ Evitar iconos rotos (ruta por defecto en bundlers)
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        // Cargar CSS de Leaflet dinámicamente
        if (typeof window !== 'undefined') {
          const existingLink = document.querySelector('link[href*="leaflet"]')
          if (!existingLink) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
            document.head.appendChild(link)
          }
        }

        // ❗ Esperar al contenedor real usando ref
        if (!containerRef.current || cancelled) return

        // ♻️ Cleanup si se re-monta
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const map = L.map(containerRef.current, {
          center: [lat, lng],
          zoom: 15,
          scrollWheelZoom: false,
          dragging: true,
          touchZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomControl: false,
          attributionControl: true
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        // Agregar marcador con icono personalizado
        L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div class="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">🏠</div>`,
            className: 'property-location-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(map)

        mapRef.current = map
        if (!cancelled) setLoaded(true)
      } catch (e: any) {
        console.error('Error loading Leaflet:', e)
        if (!cancelled) {
          setLoadError(e?.message || 'Error al cargar el mapa')
        }
      }
    }

    boot()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng])

  if (loadError) {
    return (
      <div className={`flex items-center justify-center h-72 bg-gray-100 rounded-xl ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error en el Mapa</h3>
          <p className="text-gray-600 text-sm">No se pudo cargar el mapa. {loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className || ''}`}>
      {/* ✅ Contenedor con ref y altura garantizada */}
      <div
        ref={containerRef}
        className="w-full h-72 rounded-xl overflow-hidden border shadow-sm bg-muted/30"
        style={{ minHeight: '288px' }}
      />
      
      {/* Overlay de "Cargando mapa…" que desaparece al cargar */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl">
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mapa…</p>
          </div>
        </div>
      )}

      {/* Read-only indicator */}
      {loaded && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center text-xs text-gray-600">
            <MapPin className="h-3 w-3 mr-1" />
            <span>Solo lectura</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyLocationMap
