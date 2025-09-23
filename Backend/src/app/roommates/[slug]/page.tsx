'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Eye, Share2, Flag, MessageCircle, MapPin, Calendar, Home, User, Edit } from 'lucide-react'
import Link from 'next/link'
import { RoommateDetail } from '@/types/roommate'

export default function RoommateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [roommate, setRoommate] = useState<RoommateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Cargar detalle del roommate
  useEffect(() => {
    if (!slug) return

    const loadRoommate = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log('Cargando roommate:', slug)

        const response = await fetch(`/api/roommates/${slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Roommate no encontrado')
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Roommate cargado:', data)

        setRoommate(data)

        // Incrementar vista (solo si no es el dueño)
        if (!data.canEdit) {
          try {
            await fetch(`/api/roommates/${data.id}/view`, {
              method: 'POST',
            })
          } catch (viewError) {
            console.warn('Error incrementando vista:', viewError)
            // No fallar por esto
          }
        }

      } catch (err) {
        console.error('Error cargando roommate:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadRoommate()
  }, [slug])

  // Manejar like/unlike
  const handleLike = async () => {
    if (!roommate || actionLoading) return

    setActionLoading('like')

    try {
      const response = await fetch(`/api/roommates/${roommate.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      if (!response.ok) {
        throw new Error('Error al procesar like')
      }

      const result = await response.json()
      
      // Actualizar estado local
      setRoommate(prev => prev ? {
        ...prev,
        likesCount: result.likesCount,
        isLiked: result.isLiked
      } : null)

    } catch (err) {
      console.error('Error con like:', err)
      // Mostrar notificación de error
    } finally {
      setActionLoading(null)
    }
  }

  // Manejar compartir
  const handleShare = async () => {
    if (!roommate) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: roommate.title,
          text: `${roommate.description.substring(0, 100)}...`,
          url: window.location.href,
        })
      } else {
        // Fallback: copiar al clipboard
        await navigator.clipboard.writeText(window.location.href)
        // Mostrar notificación de éxito
        alert('Enlace copiado al portapapeles')
      }
    } catch (err) {
      console.error('Error compartiendo:', err)
    }
  }

  // Manejar reporte
  const handleReport = async () => {
    if (!roommate) return

    const reason = prompt('Razón del reporte (SPAM, INAPPROPRIATE, FAKE, OTHER):')
    if (!reason) return

    const description = prompt('Descripción adicional (opcional):')

    setActionLoading('report')

    try {
      const response = await fetch(`/api/roommates/${roommate.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason.toUpperCase(),
          description: description || undefined
        }),
      })

      if (response.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      if (!response.ok) {
        throw new Error('Error al enviar reporte')
      }

      alert('Reporte enviado exitosamente. Será revisado por nuestro equipo.')

    } catch (err) {
      console.error('Error con reporte:', err)
      alert('Error al enviar reporte. Intenta nuevamente.')
    } finally {
      setActionLoading(null)
    }
  }

  // Formatear fecha
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dateObj)
  }

  // Formatear precio
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando roommate...</p>
        </div>
      </div>
    )
  }

  if (error || !roommate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error === 'Roommate no encontrado' ? 'Post no encontrado' : 'Error'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'No se pudo cargar la información del roommate'}
          </p>
          <Link
            href="/roommates"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al feed
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/roommates"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al feed
            </Link>
            
            {roommate.canEdit && (
              <Link
                href={`/roommates/${roommate.slug}/editar`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Galería de imágenes */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {roommate.images && roommate.images.length > 0 ? (
                <div className="aspect-video bg-gray-200">
                  <img
                    src={roommate.images[0]}
                    alt={roommate.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Sin imágenes disponibles aún</p>
                  </div>
                </div>
              )}
              
              {/* Thumbnails si hay más imágenes */}
              {roommate.images && roommate.images.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto">
                    {roommate.images.slice(1, 6).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${roommate.title} - ${index + 2}`}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                      />
                    ))}
                    {roommate.images.length > 6 && (
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 text-sm">
                        +{roommate.images.length - 6}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Información principal */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {roommate.title}
                </h1>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    roommate.roomType === 'PRIVATE' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {roommate.roomType === 'PRIVATE' ? 'Habitación Privada' : 'Habitación Compartida'}
                  </span>
                  
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {roommate.city}, {roommate.province}
                  </span>
                </div>

                {/* Precio destacado */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {formatPrice(roommate.monthlyRent)}
                    </div>
                    <div className="text-green-700">por mes</div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{roommate.description}</p>
                </div>
              </div>

              {/* Preferencias */}
              {roommate.preferences && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Preferencias</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{roommate.preferences}</p>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Disponible desde</div>
                    <div className="text-sm">{formatDate(roommate.availableFrom)}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <User className="w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Publicado</div>
                    <div className="text-sm">{formatDate(roommate.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Acciones principales */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                
                <div className="space-y-3">
                  {/* Contactar */}
                  <button
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => {
                      // Redirigir al sistema de mensajes
                      router.push(`/messages?contact=${roommate.author?.id}&subject=${encodeURIComponent(roommate.title)}`)
                    }}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contactar
                  </button>

                  {/* Like */}
                  {!roommate.canEdit && (
                    <button
                      onClick={handleLike}
                      disabled={actionLoading === 'like'}
                      className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-colors font-medium ${
                        roommate.isLiked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      <Heart className={`w-5 h-5 mr-2 ${roommate.isLiked ? 'fill-current' : ''}`} />
                      {actionLoading === 'like' ? 'Procesando...' : roommate.isLiked ? 'Quitar Me Gusta' : 'Me Gusta'}
                    </button>
                  )}

                  {/* Compartir */}
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Compartir
                  </button>

                  {/* Reportar */}
                  {!roommate.canEdit && (
                    <button
                      onClick={handleReport}
                      disabled={actionLoading === 'report'}
                      className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      <Flag className="w-5 h-5 mr-2" />
                      {actionLoading === 'report' ? 'Enviando...' : 'Reportar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{roommate.likesCount}</div>
                    <div className="text-sm text-gray-600">Me gusta</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{roommate.viewsCount}</div>
                    <div className="text-sm text-gray-600">Vistas</div>
                  </div>
                </div>
              </div>

              {/* Información del autor */}
              {roommate.author && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Publicado por</h3>
                  
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {roommate.author.avatar ? (
                        <img
                          src={roommate.author.avatar}
                          alt={roommate.author.name || 'Usuario'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">
                        {roommate.author.name || 'Usuario'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Miembro desde {formatDate(roommate.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Consejos de seguridad */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                  🔒 Consejos de Seguridad
                </h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• Conoce al roommate en persona antes de decidir</li>
                  <li>• Verifica referencias y antecedentes</li>
                  <li>• Visita el lugar antes de comprometerte</li>
                  <li>• Usa contratos claros y por escrito</li>
                  <li>• Confía en tu instinto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
