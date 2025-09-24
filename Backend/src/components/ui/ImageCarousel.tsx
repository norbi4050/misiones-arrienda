'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CarouselImage {
  src: string
  alt?: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  initialIndex?: number
  className?: string
  showThumbnails?: boolean
  enableZoom?: boolean
}

export default function ImageCarousel({
  images,
  initialIndex = 0,
  className = '',
  showThumbnails = true,
  enableZoom = true
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState<Set<number>>(new Set())

  // Filtrar imágenes válidas (sin errores)
  const validImages = images.filter((_, index) => !imageErrors.has(index))

  // Navegación con teclado
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isLightboxOpen) return
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        goToPrevious()
        break
      case 'ArrowRight':
        event.preventDefault()
        goToNext()
        break
      case 'Escape':
        event.preventDefault()
        setIsLightboxOpen(false)
        break
    }
  }, [isLightboxOpen])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Navegación
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
  }

  // Manejo de errores de imagen
  const handleImageError = (index: number) => {
    console.warn(`Error cargando imagen ${index}:`, images[index]?.src)
    setImageErrors(prev => new Set([...prev, index]))
    setIsLoading(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const handleImageLoad = (index: number) => {
    setIsLoading(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const handleImageLoadStart = (index: number) => {
    setIsLoading(prev => new Set([...prev, index]))
  }

  // Si no hay imágenes válidas
  if (validImages.length === 0) {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Sin imágenes disponibles</p>
            <Badge variant="secondary" className="mt-2">
              Sin imágenes
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  const currentImage = validImages[currentIndex]

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Imagen principal */}
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
          {currentImage && (
            <>
              {isLoading.has(currentIndex) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              <Image
                src={currentImage.src}
                alt={currentImage.alt || `Imagen ${currentIndex + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={currentIndex === 0}
                onLoadingComplete={() => handleImageLoad(currentIndex)}
                onLoadStart={() => handleImageLoadStart(currentIndex)}
                onError={() => handleImageError(currentIndex)}
              />

              {/* Overlay con controles */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
                {/* Botón zoom */}
                {enableZoom && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                )}

                {/* Navegación */}
                {validImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={goToPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={goToNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Contador de imágenes */}
              {validImages.length > 1 && (
                <div className="absolute bottom-4 left-4">
                  <Badge variant="secondary" className="bg-black bg-opacity-50 text-white">
                    {currentIndex + 1} / {validImages.length}
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && validImages.length > 1 && (
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && enableZoom && currentImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          {/* Cerrar */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 z-10"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Navegación en lightbox */}
          {validImages.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Imagen en lightbox */}
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            <Image
              src={currentImage.src}
              alt={currentImage.alt || `Imagen ${currentIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              onError={() => handleImageError(currentIndex)}
            />
          </div>

          {/* Contador en lightbox */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Badge variant="secondary" className="bg-black bg-opacity-50 text-white">
              {currentIndex + 1} / {validImages.length}
            </Badge>
          </div>
        </div>
      )}
    </>
  )
}

// Hook para usar con datos de propiedades
export function usePropertyCarousel(propertyId: string, userId: string, fallbackImages: string[] = []) {
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'bucket' | 'fallback' | 'placeholder'>('placeholder')

  useEffect(() => {
    async function loadCarouselImages() {
      setLoading(true)
      
      try {
        // Usar sistema bucket-first existente
        const { getPropertyImages } = await import('@/lib/property-images')
        
        const imageUrls = await getPropertyImages({
          propertyId,
          userId,
          fallbackImages,
          maxImages: 10
        })
        
        const formattedImages: CarouselImage[] = imageUrls.map((url, index) => ({
          src: url,
          alt: `Imagen ${index + 1} de la propiedad`
        }))
        
        setCarouselImages(formattedImages)
        
        // Determinar fuente
        if (imageUrls.length > 0 && imageUrls[0].includes('supabase.co')) {
          setSource('bucket')
        } else if (fallbackImages.length > 0) {
          setSource('fallback')
        } else {
          setSource('placeholder')
        }
        
      } catch (error) {
        console.error('Error loading carousel images:', error)
        setCarouselImages([{ src: '/placeholder-apartment-1.jpg', alt: 'Imagen no disponible' }])
        setSource('placeholder')
      } finally {
        setLoading(false)
      }
    }

    if (propertyId && userId) {
      loadCarouselImages()
    }
  }, [propertyId, userId, fallbackImages])

  return { images: carouselImages, loading, source }
}
