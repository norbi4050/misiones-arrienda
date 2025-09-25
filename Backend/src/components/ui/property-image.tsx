'use client'

import Image from 'next/image'
import { getFirstValidImage } from '@/lib/property-images.client'

interface PropertyImageProps {
  src?: string
  alt?: string
  fallback?: string
  fill?: boolean
  className?: string
  priority?: boolean
  width?: number
  height?: number
  onImageLoad?: () => void
  onImageError?: () => void
}

/**
 * Componente PropertyImage puramente cliente
 * Renderiza la imagen recibida por props (sin lógica de server)
 */
export default function PropertyImage({
  src,
  alt = 'Imagen de propiedad',
  fallback,
  fill = false,
  className = '',
  priority = false,
  width,
  height,
  onImageLoad,
  onImageError
}: PropertyImageProps) {
  // Obtener la imagen válida o fallback
  const imageSrc = getFirstValidImage([src], fallback)

  // Manejar error de carga de imagen
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn(`⚠️ Error cargando imagen: ${imageSrc}`)
    
    // Si hay fallback, intentar usarlo
    if (fallback && imageSrc !== fallback) {
      const target = e.target as HTMLImageElement
      target.src = fallback
    } else {
      // Usar placeholder final
      const target = e.target as HTMLImageElement
      target.src = '/placeholder-apartment-1.jpg'
    }
    
    onImageError?.()
  }

  const handleImageLoad = () => {
    onImageLoad?.()
  }

  // Renderizar imagen
  const imageProps = {
    src: imageSrc,
    alt,
    className: `object-cover ${className}`,
    onLoad: handleImageLoad,
    onError: handleImageError,
    priority
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  return (
    <Image 
      {...imageProps} 
      width={width || 400} 
      height={height || 300}
    />
  )
}

/**
 * Componente para múltiples imágenes (carrusel/galería)
 */
interface PropertyImageGalleryProps {
  imageUrls?: string[]
  className?: string
}

export function PropertyImageGallery({
  imageUrls = [],
  className = ''
}: PropertyImageGalleryProps) {
  const images = imageUrls.length > 0 ? imageUrls : ['/placeholder-apartment-1.jpg']

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden">
          <Image
            src={image}
            alt={`Imagen ${index + 1}`}
            fill
            className="object-cover"
            onError={(e) => {
              console.warn(`⚠️ Error cargando imagen ${index + 1}:`, image)
              // Reemplazar con placeholder si falla
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-apartment-1.jpg'
            }}
          />
        </div>
      ))}
    </div>
  )
}
