'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageCarouselProps {
  images: string[]
  altBase: string
}

export default function ImageCarousel({ images, altBase }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Reset to first image when images change
  useEffect(() => {
    setCurrentIndex(0)
  }, [images])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious()
      } else if (event.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Fallback when no images
  if (!images || images.length === 0) {
    return (
      <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-2">🏠</div>
          <p className="text-lg font-medium">No hay imágenes disponibles</p>
          <p className="text-sm">La propiedad no tiene fotos cargadas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Main Image Container */}
      <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
        <Image
          src={images[currentIndex]}
          alt={`${altBase} - Imagen ${currentIndex + 1} de ${images.length}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority={currentIndex === 0}
          onError={(e) => {
            // Hide broken images
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Image Counter */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Bullet Navigation */}
      {images.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Strip (Optional - can be enabled later) */}
      {/*
      {images.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? 'border-blue-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${altBase} - Miniatura ${index + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </button>
          ))}
        </div>
      )}
      */}
    </div>
  )
}
