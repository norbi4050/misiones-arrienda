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
    <div className="space-y-2">
      <div className="w-full h-72 rounded-lg border overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
      </div>
      <div className="text-xs text-gray-500">
        💡 Arrastrá el marcador o hacé click en el mapa para seleccionar la ubicación exacta
      </div>
      {value && (
        <div className="text-xs text-gray-600">
          📍 Coordenadas: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
