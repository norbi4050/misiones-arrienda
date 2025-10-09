'use client'

import { useState } from 'react'

interface SafeImageProps {
  src?: string | null
  alt: string
  fallback?: string
  className?: string
  onError?: () => void
}

/**
 * Componente de imagen con manejo robusto de errores
 * - Muestra fallback si la imagen falla al cargar
 * - Muestra loading state mientras carga
 * - Logs de errores para debugging
 */
export function SafeImage({ 
  src, 
  alt, 
  fallback = '/placeholder-house-1.jpg',
  className = '',
  onError: onErrorCallback
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
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  )
}
