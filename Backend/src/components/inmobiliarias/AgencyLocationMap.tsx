'use client';

import { MapPin } from 'lucide-react';
import { Location } from '@/types/inmobiliaria';

interface AgencyLocationMapProps {
  location: Location;
  agencyName: string;
  className?: string;
}

/**
 * Componente: Mapa de Ubicación (Estático)
 * 
 * Muestra un mapa estático de la ubicación de la inmobiliaria:
 * - Imagen estática (no interactivo)
 * - Zoom fijo para mostrar 4 manzanas
 * - Pin en el centro
 * - Usa Google Maps Static API o Mapbox Static
 * 
 * Uso: Perfil público de inmobiliarias
 */
export default function AgencyLocationMap({ 
  location, 
  agencyName,
  className = '' 
}: AgencyLocationMapProps) {
  // Si no hay coordenadas, no mostrar mapa
  if (!location.latitude || !location.longitude) {
    return null;
  }

  // Construir URL del mapa estático
  // Usando Google Maps Static API (requiere API key en .env)
  // Zoom 17 = aproximadamente 3 manzanas a la redonda
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.latitude},${location.longitude}&zoom=17&size=600x300&markers=color:red%7C${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`;

  // Alternativa con Mapbox Static (si no hay Google Maps API key)
  // Zoom 17 = aproximadamente 3 manzanas a la redonda
  const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l-building+3b82f6(${location.longitude},${location.latitude})/${location.longitude},${location.latitude},17,0/600x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}`;

  // Usar Google Maps si hay API key, sino Mapbox
  const finalMapUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? mapUrl : mapboxUrl;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ubicación
          </h3>
        </div>
      </div>

      {/* Mapa estático */}
      <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700">
        <img
          src={finalMapUrl}
          alt={`Ubicación de ${agencyName}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Ocultar imagen que falló
            e.currentTarget.style.display = 'none';

            // Mostrar mensaje de error en el contenedor padre
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector('.map-error-message')) {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'map-error-message flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-4';
              errorDiv.innerHTML = `
                <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <p class="text-sm font-medium mb-1">No se pudo cargar el mapa</p>
                <p class="text-xs text-center">La dirección se encuentra a continuación</p>
              `;
              parent.appendChild(errorDiv);
            }
          }}
        />
      </div>

      {/* Dirección */}
      {location.address && (
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {location.address}
          </p>
        </div>
      )}
    </div>
  );
}
