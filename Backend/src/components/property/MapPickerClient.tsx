"use client";

// 👇 Import obligatorio para que las teselas se posicionen bien
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Fix para iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPickerClientProps {
  value?: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
}

export default function MapPickerClient({ value, onChange }: MapPickerClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Coordenadas por defecto (Posadas, Misiones)
    const defaultCenter: [number, number] = value ? [value.lat, value.lng] : [-27.3676, -55.8961];
    
    const m = L.map(mapRef.current).setView(defaultCenter, 13);
    
    // Agregar tiles de OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(m);
    
    // 👇 Forzar cálculo correcto cuando el contenedor ya tiene tamaño
    setTimeout(() => m.invalidateSize(), 0);
    
    // Crear marker draggable
    const mk = L.marker(defaultCenter, { draggable: true }).addTo(m);
    
    // Evento cuando se mueve el marker
    mk.on("moveend", (e: any) => {
      const ll = e.target.getLatLng();
      onChange({ lat: ll.lat, lng: ll.lng });
    });
    
    // Evento click en el mapa para mover marker
    m.on("click", (e: L.LeafletMouseEvent) => {
      mk.setLatLng(e.latlng);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    
    // 👇 Ajustar en cambios de tamaño de ventana
    const onResize = () => m.invalidateSize();
    window.addEventListener("resize", onResize);
    
    setMap(m);
    setMarker(mk);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      if (m) {
        m.remove();
      }
    };
  }, [mapRef]);

  // Actualizar marker cuando cambia el value externamente
  useEffect(() => {
    if (marker && value) {
      marker.setLatLng([value.lat, value.lng]);
      if (map) {
        map.setView([value.lat, value.lng], map.getZoom());
      }
    }
  }, [value, marker, map]);

  return (
    <div className="space-y-4">
      <div className="w-full h-72 rounded-lg border border-gray-300 overflow-hidden shadow-sm">
        <div ref={mapRef} className="w-full h-full" />
      </div>
      
      {/* Información debajo del mapa */}
      <div className="space-y-2">
        {/* Instrucciones de uso */}
        <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
          <span className="text-blue-500 flex-shrink-0">💡</span>
          <p>Arrastrá el marcador o hacé click en el mapa para seleccionar la ubicación exacta</p>
        </div>
        
        {/* Coordenadas seleccionadas */}
        {value && (
          <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-md p-3">
            <span className="text-green-600 flex-shrink-0">✓</span>
            <div className="flex-1">
              <span className="font-medium text-gray-700">Coordenadas seleccionadas:</span>
              <span className="ml-2 font-mono text-gray-900">{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
