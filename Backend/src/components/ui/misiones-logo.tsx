import React from 'react'
import { cn } from '@/utils'

interface MisionesLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'primary' | 'white'
}

export function MisionesLogo({ size = 'md', className, color = 'primary' }: MisionesLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-10',
    md: 'w-12 h-16', 
    lg: 'w-16 h-20'
  }

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {/* Logo real de Misiones Arrienda - Casa + Silueta */}
      <svg 
        viewBox="0 0 100 140" 
        className={cn(sizeClasses[size], colorClasses[color])}
        fill="currentColor"
      >
        {/* Casa en la parte superior */}
        <g transform="translate(35, 10)">
          {/* Techo de la casa */}
          <path d="M15 25 L5 35 L25 35 Z" />
          {/* Cuerpo de la casa */}
          <rect x="8" y="35" width="14" height="12" />
          {/* Ventanas */}
          <rect x="10" y="37" width="3" height="3" fill="white" />
          <rect x="17" y="37" width="3" height="3" fill="white" />
          {/* Puerta */}
          <rect x="13" y="42" width="4" height="5" fill="white" />
        </g>
        
        {/* Silueta de Misiones debajo */}
        <g transform="translate(0, 55)">
          {/* Forma característica de la provincia de Misiones */}
          <path d="M20 10 L80 10 L85 20 L88 35 L85 50 L80 65 L75 75 L65 80 L55 82 L45 82 L35 80 L25 75 L20 65 L15 50 L12 35 L15 20 Z" />
          {/* Detalles internos */}
          <path d="M30 25 L70 25 L72 35 L70 45 L65 55 L60 62 L50 65 L40 62 L35 55 L30 45 L28 35 Z" 
                fill="rgba(255,255,255,0.15)" />
        </g>
      </svg>
    </div>
  )
}
