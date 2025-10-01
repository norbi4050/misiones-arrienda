'use client'

import { useState } from 'react'

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
 * - Manejo robusto de errores
 */
export function SafeAvatar({ 
  src, 
  name, 
  size = 'md',
  className = '' 
}: SafeAvatarProps) {
  const [error, setError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const initial = name?.charAt(0).toUpperCase() || '?'

  const handleError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SafeAvatar] Failed to load avatar for ${name}: ${src}`)
    }
    setError(true)
  }

  // Si no hay src o hubo error, mostrar inicial
  if (!src || error) {
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
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={handleError}
        loading="lazy"
      />
    </div>
  )
}
