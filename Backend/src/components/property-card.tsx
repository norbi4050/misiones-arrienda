"use client"

import { Home, Ruler, FileImage } from "lucide-react" // Usar iconos que funcionan
import { FavoriteButton } from "@/components/favorite-button"
import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"

interface PropertyCardProps {
  id: string
  title: string
  price: number
  images?: unknown // Mantenemos para compatibilidad
  coverUrl?: string // Signed URL del cover desde API
  coverUrlExpiresAt?: string // Expiración del signed URL
  isPlaceholder?: boolean // Si es placeholder
  imagesCount?: number // Contador optimizado
  city: string
  province: string
  bedrooms: number
  bathrooms: number
  area: number
  propertyType?: string // Para placeholder inteligente
  // NO incluir userId por seguridad
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
  // Regla de imagen: mainImage = coverUrl ?? images?.[0] ?? placeholder
  const coverSrc = useMemo(() => {
    // 1. Prioridad: coverUrl del API (ya procesado)
    if (coverUrl && coverUrl.trim()) {
      return coverUrl
    }
    
    // 2. Fallback: primera imagen del array images (ya son URLs absolutas)
    if (images && Array.isArray(images) && images.length > 0) {
      const firstImage = images[0]
      // Guard: verificar que sea URL absoluta
      if (firstImage && typeof firstImage === 'string') {
        if (!firstImage.startsWith('http') && process.env.NODE_ENV !== 'production') {
          console.warn('[CARD] imagen no absoluta', firstImage)
        }
        return firstImage
      }
    }
    
    // 3. Fallback: parsear images si es string (compatibilidad legacy)
    if (images && typeof images === 'string') {
      try {
        const parsedImages = JSON.parse(images)
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          return parsedImages[0]
        }
      } catch {
        // Si falla el parsing, continuar con placeholder
      }
    }
    
    // 4. Placeholder final basado en tipo de propiedad
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

  // Usar imagesCount directamente del API
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
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-500">
              <FileImage className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium">Sin imágenes</span>
              <span className="text-xs">Agregar fotos</span>
            </div>
          )}

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
              <FileImage className="w-3 h-3" />
              <span>{totalImages}</span>
            </div>
          )}

          {/* Indicador de signed URL (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && !isPlaceholder && coverUrlExpiresAt && (
            <div className="absolute top-2 left-2 z-10 bg-green-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
              🔒 Signed
            </div>
          )}

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Contenido de la card */}
        <div className="p-3">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">
            {city}, {province}
          </div>

          {/* Property details with icons */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                <span>{bedrooms}</span>
              </div>
            )}
            {bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                <span>{bathrooms}</span>
              </div>
            )}
            {area > 0 && (
              <div className="flex items-center gap-1">
                <Ruler className="w-4 h-4" />
                <span>{area}m²</span>
              </div>
            )}
          </div>

          <div className="text-blue-600 font-bold mt-1">${Number(price ?? 0).toLocaleString()}</div>
        </div>
      </div>
    </Link>
  )
}
