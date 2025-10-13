'use client'

import { useState, useEffect } from 'react'

interface SafeAvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Componente de avatar con fallback a iniciales
 * - Muestra imagen si está disponible
 * - Fallback a inicial del nombre si la imagen falla
 * - Manejo robusto de errores y respuestas 304
 * - Cache-busting para evitar problemas con Supabase Storage
 */
export function SafeAvatar({ 
  src, 
  name, 
  size = 'md',
  className = '' 
}: SafeAvatarProps): JSX.Element {
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const initial = name?.charAt(0).toUpperCase() || '?'

  // Efecto para manejar cambios en src y agregar cache-busting
  useEffect(() => {
    if (!src) {
      setImageSrc(null)
      setError(false)
      return
    }

    // Agregar timestamp para evitar 304 en imágenes de Supabase Storage
    // Solo si la URL es de Supabase Storage (contiene 'supabase.co/storage')
    if (src.includes('supabase.co/storage')) {
      try {
        const url = new URL(src)
        // Agregar timestamp solo si no existe ya un parámetro de cache-busting
        if (!url.searchParams.has('t') && !url.searchParams.has('_t')) {
          url.searchParams.set('t', Date.now().toString())
          setImageSrc(url.toString())
        } else {
          setImageSrc(src)
        }
      } catch (e) {
        // Si falla el parseo de URL, usar src original
        setImageSrc(src)
      }
    } else {
      setImageSrc(src)
    }
    
    setError(false)
  }, [src])

  const handleError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SafeAvatar] Failed to load avatar for ${name}: ${src}`)
    }
    setError(true)
  }

  // Si no hay src o hubo error, mostrar inicial
  if (!imageSrc || error) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ${className}`}
        title={name}
      >
        <span className="font-semibold text-white">{initial}</span>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={name}
        className="w-full h-full object-cover"
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous"
      />
    </div>
  )
}
