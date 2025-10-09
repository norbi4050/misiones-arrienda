"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';

// Importación dinámica para evitar SSR issues con Leaflet
const MapPickerClient = dynamic(() => import('./MapPickerClient'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-lg border bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Cargando mapa...</div>
    </div>
  )
});

interface MapPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
  className?: string;
}

export default function MapPicker({ value, onChange, className = "" }: MapPickerProps) {
  return (
    <div className={className}>
      <MapPickerClient value={value} onChange={onChange} />
    </div>
  );
}
