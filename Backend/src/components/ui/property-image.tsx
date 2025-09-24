'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getPropertyCoverImage } from '@/lib/property-images'

interface PropertyImageProps {
  propertyId: string
  userId: string
  fallbackImage?: string
  alt: string
  fill?: boolean
  className?: string
  priority?: boolean
  width?: number
  height?: number
  onImageLoad?: () => void
  onImageError?: () => void
}

/**
 * Componente PropertyImage con sistema bucket-first fallback
 * Prioriza bucket privado con signed URLs, luego fallback a property.images
 */
export default function PropertyImage({
  propertyId,
  userId,
  fallbackImage,
  alt,
  fill = false,
  className = '',
  priority = false,
  width,
  height,
  onImageLoad,
  onImageError
}: PropertyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('/placeholder-apartment-1.jpg')
  const [loading, setLoading] = useState(true)
  const [imageSource, setImageSource] = useState<'bucket' | 'fallback' | 'placeholder'>('placeholder')

  // Cargar imagen con sistema bucket-first
  useEffect(() => {
    async function loadImage() {
      if (!propertyId || !userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        const imageUrl = await getPropertyCoverImage(propertyId, userId, fallbackImage)
        
        setImageSrc(imageUrl)
        
        // Determinar fuente para debugging
        if (imageUrl.includes('supabase.co')) {
          setImageSource('bucket')
          console.log(`🎯 PropertyImage: Usando bucket para ${propertyId}`)
        } else if (fallbackImage && imageUrl === fallbackImage) {
          setImageSource('fallback')
          console.log(`📁 PropertyImage: Usando fallback para ${propertyId}`)
        } else {
          setImageSource('placeholder')
          console.log(`🖼️ PropertyImage: Usando placeholder para ${propertyId}`)
        }
        
      } catch (error) {
        console.error('❌ Error cargando PropertyImage:', error)
        setImageSrc(fallbackImage || '/placeholder-apartment-1.jpg')
        setImageSource(fallbackImage ? 'fallback' : 'placeholder')
      } finally {
        setLoading(false)
      }
    }

    loadImage()
  }, [propertyId, userId, fallbackImage])

  // Manejar error de carga de imagen
  const handleImageError = () => {
    console.warn(`⚠️ Error cargando imagen: ${imageSrc}`)
    
    // Si falla la imagen del bucket, intentar fallback
    if (imageSource === 'bucket' && fallbackImage) {
      console.log(`🔄 Fallback: cambiando a property.images para ${propertyId}`)
      setImageSrc(fallbackImage)
      setImageSource('fallback')
    } else {
      // Si falla todo, usar placeholder
      console.log(`🖼️ Usando placeholder final para ${propertyId}`)
      setImageSrc('/placeholder-apartment-1.jpg')
      setImageSource('placeholder')
    }
    
    onImageError?.()
  }

  const handleImageLoad = () => {
    console.log(`✅ Imagen cargada exitosamente: ${imageSource} para ${propertyId}`)
    onImageLoad?.()
  }

  // Mostrar loading state
  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`} style={{ width, height }}>
        <div className="w-full h-full bg-gray-300 rounded"></div>
      </div>
    )
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
  propertyId: string
  userId: string
  fallbackImages?: string[]
  maxImages?: number
  className?: string
}

export function PropertyImageGallery({
  propertyId,
  userId,
  fallbackImages = [],
  maxImages = 10,
  className = ''
}: PropertyImageGalleryProps) {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'bucket' | 'fallback' | 'placeholder'>('placeholder')

  useEffect(() => {
    async function loadImages() {
      if (!propertyId || !userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Importar dinámicamente para evitar SSR issues
        const { getPropertyImages } = await import('@/lib/property-images')
        
        const result = await getPropertyImages({
          propertyId,
          userId,
          fallbackImages,
          maxImages
        })
        
        setImages(result)
        
        // Determinar fuente
        if (result.length > 0 && result[0].includes('supabase.co')) {
          setSource('bucket')
        } else if (fallbackImages.length > 0 && result.some(img => fallbackImages.includes(img))) {
          setSource('fallback')
        } else {
          setSource('placeholder')
        }
        
      } catch (error) {
        console.error('Error loading property gallery:', error)
        setImages(['/placeholder-apartment-1.jpg'])
        setSource('placeholder')
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [propertyId, userId, fallbackImages, maxImages])

  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    )
  }

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
          {/* Badge para mostrar fuente en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {source}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
