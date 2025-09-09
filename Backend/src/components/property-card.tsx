"use client"

import { MapPin, Bed, Bath, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import Image from "next/image"
import Link from "next/link"

interface PropertyCardProps {
  id: string
  title: string
  price: number
  images: unknown
  city: string
  province: string
  bedrooms: number
  bathrooms: number
  area: number
}

export function PropertyCard({
  id,
  title,
  price,
  images,
  city,
  province,
  bedrooms,
  bathrooms,
  area,
}: PropertyCardProps) {
  // --- FIX imágenes: parseo defensivo + normalización para next/image ---
  const parseImages = (val: unknown): string[] => {
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return [];
      try {
        const maybe = JSON.parse(s);
        return Array.isArray(maybe) ? (maybe as string[]) : [s];
      } catch {
        return [s];
      }
    }
    return [];
  };
  const normalizeSrc = (s: string): string =>
    s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') ? s : `/${s}`;
  const safeImages = parseImages(images);
  const cover = normalizeSrc(safeImages[0] ?? '/placeholder-apartment-1.jpg');
  console.log('PropertyCard cover:', { id, cover, raw: images });

  return (
    <Link href={`/properties/${id}`} className="block">
      <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        {/* Contenedor con altura fija para que la imagen no sea gigante */}
        <div className="relative w-full h-56 sm:h-56 md:h-60 lg:h-64 overflow-hidden rounded-md">
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // fallback de runtime si la URL falla
              const img = e.currentTarget as any;
              if (img?.src !== '/placeholder-apartment-1.jpg') {
                img.src = '/placeholder-apartment-1.jpg';
              }
            }}
          />

          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <FavoriteButton
              propertyId={id}
              size="sm"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            />
          </div>

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Más contenido visible para validar */}
        <div className="p-3">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">
            {city}, {province}
          </div>
          <div className="text-blue-600 font-bold mt-1">${Number(price ?? 0).toLocaleString()}</div>
        </div>
      </div>
    </Link>
  )
}
