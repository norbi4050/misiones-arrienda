"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Tipos para las propiedades
interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  lat: number;
  lng: number;
  propertyType: string;
  bedrooms?: number;
  city: string;
  featured?: boolean;
}

interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

interface PropertiesMapProps {
  items: Property[];
  bbox?: BBox | null;
  onBoundsChange?: (bbox: BBox) => void;
  onMarkerClick?: (property: Property) => void;
  className?: string;
}

// Importación dinámica de Leaflet para evitar problemas de SSR
const PropertiesMap: React.FC<PropertiesMapProps> = ({
  items,
  bbox,
  onBoundsChange,
  onMarkerClick,
  className = ""
}) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerClusterRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    let mounted = true;

    const loadLeaflet = async () => {
      try {
        // Importar Leaflet (los estilos CSS deben estar en globals.css o layout)
        const L = await import('leaflet');
        const MarkerClusterGroup = await import('leaflet.markercluster');

        if (!mounted) return;

        // Configurar iconos por defecto de Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Inicializar mapa
        const mapContainer = document.getElementById('properties-map');
        if (!mapContainer) return;

        // Coordenadas por defecto (centro de Misiones)
        const defaultCenter: [number, number] = [-26.8, -55.0];
        const defaultZoom = 8;

        const map = L.map(mapContainer).setView(defaultCenter, defaultZoom);

        // Agregar tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        // Crear grupo de clusters
        const markerCluster = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
        });

        map.addLayer(markerCluster);

        mapRef.current = map;
        markerClusterRef.current = markerCluster;

        // Configurar evento de cambio de bounds
        let boundsTimeout: NodeJS.Timeout;
        map.on('moveend', () => {
          if (onBoundsChange) {
            clearTimeout(boundsTimeout);
            boundsTimeout = setTimeout(() => {
              const bounds = map.getBounds();
              const newBbox: BBox = {
                minLng: bounds.getWest(),
                minLat: bounds.getSouth(),
                maxLng: bounds.getEast(),
                maxLat: bounds.getNorth()
              };
              onBoundsChange(newBbox);
            }, 400); // Debounce de 400ms
          }
        });

        setIsLoaded(true);

      } catch (err) {
        console.error('Error loading Leaflet:', err);
        if (mounted) {
          setError('Error cargando el mapa. Por favor, recarga la página.');
        }
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onBoundsChange]);

  // Actualizar marcadores cuando cambian las propiedades
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !markerClusterRef.current) return;

    const L = require('leaflet');
    const map = mapRef.current;
    const markerCluster = markerClusterRef.current;

    // Limpiar marcadores existentes
    markerCluster.clearLayers();
    markersRef.current = [];

    // Agregar nuevos marcadores
    items.forEach((property) => {
      if (!property.lat || !property.lng) return;

      // Crear icono personalizado para propiedades destacadas
      const icon = property.featured 
        ? L.divIcon({
            html: `<div class="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">⭐</div>`,
            className: 'custom-marker featured-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        : L.divIcon({
            html: `<div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg border-2 border-white">🏠</div>`,
            className: 'custom-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

      const marker = L.marker([property.lat, property.lng], { icon })
        .bindPopup(`
          <div class="p-2 min-w-[200px]">
            <h3 class="font-semibold text-sm mb-1">${property.title}</h3>
            <p class="text-lg font-bold text-green-600 mb-1">
              $${property.price.toLocaleString()} ${property.currency}
            </p>
            <p class="text-xs text-gray-600 mb-2">
              ${property.propertyType} • ${property.bedrooms || 0} dorm. • ${property.city}
            </p>
            <button 
              onclick="window.location.href='/properties/${encodeURIComponent(property.id)}'"
              class="w-full bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Ver Detalle
            </button>
          </div>
        `, {
          maxWidth: 250,
          className: 'property-popup'
        });

      // Evento de click en marcador
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(property);
        } else {
          router.push(`/properties/${property.id}`);
        }
      });

      // Agregar aria-label para accesibilidad
      marker.getElement()?.setAttribute('aria-label', 
        `${property.title} - $${property.price.toLocaleString()} ${property.currency}`
      );

      markerCluster.addLayer(marker);
      markersRef.current.push(marker);
    });

    // Ajustar vista si hay propiedades
    if (items.length > 0) {
      if (bbox) {
        // Usar bbox específico si se proporciona
        const bounds = L.latLngBounds(
          [bbox.minLat, bbox.minLng],
          [bbox.maxLat, bbox.maxLng]
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      } else {
        // Ajustar a todas las propiedades
        const group = new L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }

  }, [items, isLoaded, bbox, onMarkerClick, router]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error en el Mapa</h3>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        id="properties-map" 
        className="h-96 w-full rounded-lg shadow-lg"
        style={{ minHeight: '400px' }}
      />
      
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
          <div className="text-center p-6">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No hay propiedades en esta área
            </h3>
            <p className="text-gray-500 text-sm">
              Intenta ampliar el área de búsqueda o ajustar los filtros
            </p>
          </div>
        </div>
      )}

      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <div className="text-xs text-gray-600">
          {items.length} propiedades
        </div>
        {items.filter(p => p.featured).length > 0 && (
          <div className="text-xs text-yellow-600 flex items-center">
            <span className="mr-1">⭐</span>
            {items.filter(p => p.featured).length} destacadas
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            <span>Propiedades</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2">⭐</div>
            <span>Destacadas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesMap;
