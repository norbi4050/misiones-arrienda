'use client'

import React from 'react'
import Link from 'next/link'
import { Heart, Eye, MapPin, Calendar, Home, Users } from 'lucide-react'
import { RoommatePost } from '@/types/roommate'

interface RoommateCardProps {
  roommate: RoommatePost
  showActions?: boolean
  onLike?: (id: string) => void
  onEdit?: (id: string) => void
  className?: string
}

export default function RoommateCard({ 
  roommate, 
  showActions = true, 
  onLike, 
  onEdit,
  className = '' 
}: RoommateCardProps) {
  
  // Formatear fecha disponible
  const formatAvailableDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  // Formatear precio
  const formatPrice = (amount: number | null) => {
    if (amount === null || amount === 0) {
      return 'A convenir'
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Determinar badge de tipo de habitación
  const getRoomTypeBadge = (roomType: string) => {
    const badges = {
      'PRIVATE': { label: 'Habitación Privada', color: 'bg-blue-100 text-blue-800' },
      'SHARED': { label: 'Habitación Compartida', color: 'bg-green-100 text-green-800' }
    }
    return badges[roomType as keyof typeof badges] || { label: roomType, color: 'bg-gray-100 text-gray-800' }
  }

  const roomTypeBadge = getRoomTypeBadge(roommate.roomType)

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${className}`}>
      {/* Imagen de portada */}
      <div className="relative h-48 bg-gray-200">
        {roommate.coverUrl && !roommate.isPlaceholder ? (
          <img
            src={roommate.coverUrl}
            alt={roommate.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback si la imagen falla
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin imágenes disponibles aún</p>
            </div>
          </div>
        )}
        
        {/* Badge de tipo de habitación */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roomTypeBadge.color}`}>
            {roomTypeBadge.label}
          </span>
        </div>

        {/* Contador de imágenes */}
        {(roommate.imagesCount || 0) > 1 && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
            {roommate.imagesCount} fotos
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Título y precio */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
            {roommate.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(roommate.monthlyRent)}
            </span>
            <span className="text-sm text-gray-500">por mes</span>
          </div>
        </div>

        {/* Ubicación */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="text-sm truncate">
            {roommate.city}, {roommate.province}
          </span>
        </div>

        {/* Fecha disponible */}
        <div className="flex items-center text-gray-600 mb-3">
          <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="text-sm">
            Disponible desde {formatAvailableDate(roommate.availableFrom)}
          </span>
        </div>

        {/* Descripción */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {roommate.description}
        </p>

        {/* Métricas */}
        <div className="flex items-center justify-between text-gray-500 text-sm mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              <span>{roommate.likesCount}</span>
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span>{roommate.viewsCount}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {new Intl.DateTimeFormat('es-AR', {
              day: 'numeric',
              month: 'short'
            }).format(new Date(roommate.createdAt))}
          </div>
        </div>

        {/* Acciones */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <Link
              href={`/roommates/${roommate.slug || roommate.id}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition-colors mr-2"
            >
              Ver Detalle
            </Link>
            
            {/* Botón de editar para el dueño */}
            {onEdit && (
              <button
                onClick={() => onEdit(roommate.id)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                Editar
              </button>
            )}
            
            {/* Botón de like para visitantes */}
            {onLike && !onEdit && (
              <button
                onClick={() => onLike(roommate.id)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md transition-colors"
                title="Me gusta"
              >
                <Heart className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de skeleton para loading
export function RoommateCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="h-48 bg-gray-300"></div>
      
      {/* Contenido skeleton */}
      <div className="p-4">
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="h-12 bg-gray-300 rounded mb-4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded mt-3"></div>
      </div>
    </div>
  )
}

// Componente de grid de cards
interface RoommateGridProps {
  roommates: RoommatePost[]
  loading?: boolean
  showActions?: boolean
  onLike?: (id: string) => void
  onEdit?: (id: string) => void
  emptyMessage?: string
}

export function RoommateGrid({ 
  roommates, 
  loading = false, 
  showActions = true,
  onLike,
  onEdit,
  emptyMessage = "No se encontraron roommates"
}: RoommateGridProps) {
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <RoommateCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (roommates.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500">
          Intenta ajustar los filtros o revisa más tarde
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {roommates.map((roommate) => (
        <RoommateCard
          key={roommate.id}
          roommate={roommate}
          showActions={showActions}
          onLike={onLike}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
