'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SafeImageProps {
  src?: string | null
  alt: string
  fallback?: string
  className?: string
  onError?: () => void
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
}

/**
 * Componente de imagen optimizado con Next.js Image
 * - Muestra fallback si la imagen falla al cargar
 * - Muestra loading state mientras carga
 * - Optimización automática de imágenes
 * - Logs de errores para debugging
 */
export function SafeImage({
  src,
  alt,
  fallback = '/placeholder-house-1.jpg',
  className = '',
  onError: onErrorCallback,
  fill = false,
  width,
  height,
  sizes = '100vw',
  priority = false
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Si no hay src o hubo error, usar fallback
  const imageSrc = (!src || error) ? fallback : src

  const handleError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SafeImage] Failed to load: ${src}, using fallback: ${fallback}`)
    }
    setError(true)
    setLoading(false)
    onErrorCallback?.()
  }

  const handleLoad = () => {
    setLoading(false)
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse rounded ${className}`} />
      )}
      {fill ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? undefined : 'lazy'}
          priority={priority}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          width={width || 400}
          height={height || 300}
          sizes={sizes}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? undefined : 'lazy'}
          priority={priority}
        />
      )}
    </div>
  )
}
