'use client'

import React, { useState, useEffect } from 'react'
import { Heart, Eye, MapPin, Calendar, Home, Share, Flag, MessageCircle, User } from 'lucide-react'
import { RoommateDetail } from '@/types/roommate'
import { keysToPublicUrls } from '@/lib/roommates-images'

interface RoommateDetailProps {
  roommate: RoommateDetail
  onLike?: (id: string) => void
  onReport?: (id: string, reason: string, description?: string) => void
  onContact?: (id: string) => void
  className?: string
}

export default function RoommateDetailComponent({ 
  roommate, 
  onLike, 
  onReport, 
  onContact,
  className = '' 
}: RoommateDetailProps) {

  const [isLiked, setIsLiked] = useState(roommate.isLiked || false)
  const [likesCount, setLikesCount] = useState(roommate.likesCount)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  // Formatear fecha disponible
  const formatAvailableDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
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

  // Manejar like con optimistic update
  const handleLike = async () => {
    if (!onLike) return

    // Optimistic update
    const newIsLiked = !isLiked
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1
    
    setIsLiked(newIsLiked)
    setLikesCount(newLikesCount)

    try {
      await onLike(roommate.id)
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked)
      setLikesCount(likesCount)
      console.error('Error toggling like:', error)
    }
  }

  // Manejar compartir
  const handleShare = async () => {
    const url = `${window.location.origin}/roommates/${roommate.slug}`
    const title = roommate.title
    const text = `${title} - ${formatPrice(roommate.monthlyRent)} en ${roommate.city}, ${roommate.province}`

    try {
      // Intentar Web Share API
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url
        })
      } else {
        // Fallback a clipboard
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado al portapapeles')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback manual
      prompt('Copia este enlace:', url)
    }
  }

  // Manejar reporte
  const handleReport = async () => {
    if (!onReport || !reportReason) return

    setReportLoading(true)

    try {
      await onReport(roommate.id, reportReason, reportDescription)
      setShowReportModal(false)
      setReportReason('')
      setReportDescription('')
      alert('Reporte enviado exitosamente')
    } catch (error) {
      console.error('Error reporting:', error)
      alert('Error al enviar reporte')
    } finally {
      setReportLoading(false)
    }
  }

  const roomTypeBadge = getRoomTypeBadge(roommate.roomType)
  const images = keysToPublicUrls(roommate.imagesUrls || [])

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      
      {/* Galería de imágenes */}
      <div className="relative">
        {images.length > 0 ? (
          <div className="aspect-video bg-gray-200">
            <img
              src={images[0]}
              alt={roommate.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            
            {/* Contador de imágenes */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                1 / {images.length} fotos
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Sin imágenes disponibles aún</p>
              <p className="text-sm">El autor no ha subido fotos todavía</p>
            </div>
          </div>
        )}

        {/* Badge de tipo de habitación */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${roomTypeBadge.color}`}>
            {roomTypeBadge.label}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        
        {/* Header con título y precio */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {roommate.title}
          </h1>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(roommate.monthlyRent)}
              </span>
              <span className="text-gray-500 ml-2">por mes</span>
            </div>
            
            {/* Métricas */}
            <div className="flex items-center space-x-4 text-gray-500">
              <div className="flex items-center">
                <Heart className={`w-5 h-5 mr-1 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                <span>{likesCount}</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-1" />
                <span>{roommate.viewsCount}</span>
              </div>
            </div>
          </div>

          {/* Ubicación y fecha */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-gray-600">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{roommate.city}, {roommate.province}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Disponible desde {formatAvailableDate(roommate.availableFrom)}</span>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 whitespace-pre-line">
              {roommate.description}
            </p>
          </div>
        </div>

        {/* Preferencias */}
        {roommate.preferences && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Preferencias</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 whitespace-pre-line">
                {roommate.preferences}
              </p>
            </div>
          </div>
        )}

        {/* Información del autor */}
        {roommate.author && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Publicado por</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {roommate.author.name || 'Usuario'}
                </p>
                <p className="text-sm text-gray-500">
                  Publicado el {new Intl.DateTimeFormat('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }).format(new Date(roommate.createdAt))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Contactar */}
          {onContact && (
            <button
              onClick={() => onContact(roommate.id)}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contactar
            </button>
          )}

          {/* Like */}
          {onLike && (
            <button
              onClick={handleLike}
              className={`flex items-center justify-center px-6 py-3 rounded-md font-medium transition-colors ${
                isLiked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? 'Me gusta' : 'Like'}
            </button>
          )}

          {/* Compartir */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
          >
            <Share className="w-5 h-5 mr-2" />
            Compartir
          </button>

          {/* Reportar */}
          {onReport && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              <Flag className="w-5 h-5 mr-2" />
              Reportar
            </button>
          )}
        </div>
      </div>

      {/* Modal de reporte */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reportar contenido
            </h3>
            
            <div className="space-y-4">
              {/* Razón */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del reporte *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar razón</option>
                  <option value="SPAM">Spam o contenido repetitivo</option>
                  <option value="INAPPROPRIATE">Contenido inapropiado</option>
                  <option value="FAKE">Información falsa</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Proporciona más detalles sobre el problema..."
                />
              </div>
            </div>

            {/* Acciones del modal */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportLoading}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || reportLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {reportLoading ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de galería expandida (opcional)
interface RoommateGalleryProps {
  images: string[]
  title: string
  className?: string
}

export function RoommateGallery({ images, title, className = '' }: RoommateGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className={`aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Sin imágenes disponibles aún</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Imagen principal */}
      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`${title} - Imagen ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      </div>

      {/* Navegación */}
      {images.length > 1 && (
        <>
          {/* Botones anterior/siguiente */}
          <button
            onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
          >
            →
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>

          {/* Contador */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`aspect-square bg-gray-200 rounded-md overflow-hidden ${
                index === currentIndex ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          
          {/* Mostrar más */}
          {images.length > 4 && (
            <div className="aspect-square bg-gray-800 bg-opacity-75 rounded-md flex items-center justify-center text-white text-sm font-medium">
              +{images.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
