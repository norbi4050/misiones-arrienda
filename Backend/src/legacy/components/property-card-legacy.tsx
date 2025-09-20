/**
 * @deprecated Este componente está obsoleto desde la migración a signed URLs (Enero 2025)
 * @deprecated Usar src/components/property-card.tsx en su lugar
 * @deprecated Este archivo se mantiene solo como backup y NO debe ser importado
 * @deprecated Razón: Usa getPublicUrl en lugar de signed URLs para property-images
 */

"use client"

import { MapPin, Bed, Bath, Square, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"

interface PropertyCardProps {
  id: string
  title: string
  price: number
  images?: unknown // Mantenemos para compatibilidad
  coverUrl?: string // Signed URL del cover
  coverUrlExpiresAt?: string // Expiración del signed URL
  isPlaceholder?: boolean // Si es placeholder
  imagesCount?: number // Contador optimizado
  city: string
  province: string
  bedrooms: number
  bathrooms: number
  area: number
  propertyType?: string // Para placeholder inteligente
}

export function PropertyCard({
  id,
  title,
  price,
  images,
  coverUrl,
  coverUrlExpiresAt,
  isPlaceholder,
  imagesCount,
  city,
  province,
  bedrooms,
  bathrooms,
  area,
  propertyType,
}: PropertyCardProps) {
  // Usar coverUrl directamente (ya viene con signed URL o placeholder)
  const coverSrc = useMemo(() => {
    // 1. Prioridad: coverUrl del API (signed URL o placeholder)
    if (coverUrl && coverUrl.trim()) {
      return coverUrl
    }
    
    // 2. Fallback: parsear images (compatibilidad con versiones anteriores)
    if (images) {
      try {
        const parsedImages = typeof images === 'string' 
          ? JSON.parse(images) 
          : Array.isArray(images) 
            ? images 
            : []
        
        if (parsedImages.length > 0 && parsedImages[0]) {
          return parsedImages[0]
        }
      } catch {
        // Si falla el parsing, continuar con placeholder
      }
    }
    
    // 3. Placeholder final basado en tipo de propiedad
    const placeholders = {
      'HOUSE': '/placeholder-house-1.jpg',
      'APARTMENT': '/placeholder-apartment-1.jpg',
      'COMMERCIAL': '/placeholder-house-2.jpg',
      'LAND': '/placeholder-house-2.jpg',
      'OFFICE': '/placeholder-apartment-2.jpg',
      'WAREHOUSE': '/placeholder-house-2.jpg',
      'PH': '/placeholder-apartment-1.jpg',
      'STUDIO': '/placeholder-apartment-2.jpg'
    }
    
    return placeholders[propertyType as keyof typeof placeholders] || '/placeholder-house-1.jpg'
  }, [coverUrl, images, propertyType])

  // Usar imagesCount directamente
  const totalImages = useMemo(() => {
    // 1. Prioridad: imagesCount optimizado del API
    if (typeof imagesCount === 'number' && imagesCount >= 0) {
      return imagesCount
    }
    
    // 2. Fallback: contar desde images (compatibilidad)
    if (images) {
      try {
        const parsedImages = typeof images === 'string' 
          ? JSON.parse(images) 
          : Array.isArray(images) 
            ? images 
            : []
        return parsedImages.length
      } catch {
        return 0
      }
    }
    
    return 0
  }, [imagesCount, images])

  return (
    <Link href={`/properties/${id}`} className="block">
      <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        {/* Contenedor con altura fija para que la imagen no sea gigante */}
        <div className="relative w-full h-56 sm:h-56 md:h-60 lg:h-64 overflow-hidden rounded-md">
          <Image
            src={coverSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              // fallback de runtime si la URL falla
              const img = document.querySelector(`img[alt="${title}"]`) as HTMLImageElement
              if (img && img.src !== '/placeholder-house-1.jpg') {
                img.src = '/placeholder-house-1.jpg'
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

          {/* Indicador de cantidad de imágenes */}
          {totalImages > 1 && (
            <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>{totalImages}</span>
            </div>
          )}

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Más contenido visible para validar */}
        <div className="p-3">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">
            {city}, {province}
          </div>

          {/* Property details with icons */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{bedrooms}</span>
              </div>
            )}
            {bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{bathrooms}</span>
              </div>
            )}
            {area > 0 && (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4" />
                <span>{area}</span>
              </div>
            )}
          </div>

          <div className="text-blue-600 font-bold mt-1">${Number(price ?? 0).toLocaleString()}</div>
        </div>
      </div>
    </Link>
  )
}
