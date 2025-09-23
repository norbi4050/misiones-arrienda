'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heart, MessageCircle, MapPin, Calendar, ArrowLeft, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import Image from 'next/image'
import { NewUserBadge } from '@/components/ui/new-user-badge'

interface ProfileDetailClientProps {
  profile: {
    id: string
    user: {
      id: string
      name: string
      avatar?: string
      rating?: number
      reviewCount?: number
    }
    role: 'BUSCO' | 'OFREZCO'
    city: string
    neighborhood: string
    budgetMin: number
    budgetMax: number
    bio: string
    age: number
    tags: string[]
    petPref?: string
    smokePref?: string
    diet?: string
    scheduleNotes?: string
    photos?: string[]
    acceptsMessages?: boolean
    createdAt: string | Date
    _count?: {
      likesReceived: number
    }
  }
}

export default function ProfileDetailClient({ profile }: ProfileDetailClientProps) {
  const router = useRouter()
  const { user } = useSupabaseAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'like' | 'message' | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // Verificar si es el propio perfil
  const isOwnProfile = user?.id === profile.user.id

  useEffect(() => {
    if (user && !isOwnProfile) {
      checkLikeAndMatchStatus()
    }
  }, [user, profile.id])

  const checkLikeAndMatchStatus = async () => {
    try {
      // Verificar si ya dio like
      const likesResponse = await fetch('/api/comunidad/likes')
      if (likesResponse.ok) {
        const likes = await likesResponse.json()
        const hasLiked = likes.some((like: any) => like.liked_profile_id === profile.id)
        setIsLiked(hasLiked)
      }

      // Verificar si hay match
      const matchesResponse = await fetch('/api/comunidad/matches')
      if (matchesResponse.ok) {
        const matches = await matchesResponse.json()
        const hasMatch = matches.some((match: any) =>
          (match.user1_id === user?.id && match.user2_id === profile.user.id) ||
          (match.user2_id === user?.id && match.user1_id === profile.user.id)
        )
        setIsMatched(hasMatch)
      }
    } catch (error) {
      console.error('Error checking like/match status:', error)
    }
  }

  const handleLike = async () => {
    if (!user || isOwnProfile || loadingAction) return

    setLoadingAction('like')
    try {
      const method = isLiked ? 'DELETE' : 'POST'
      const response = await fetch('/api/comunidad/likes', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liked_profile_id: profile.id
        })
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        // Verificar si se creó un match
        if (!isLiked) {
          await checkLikeAndMatchStatus()
        }
      }
    } catch (error) {
      console.error('Error al dar like:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleMessage = async () => {
    if (!user || isOwnProfile || !isMatched || loadingAction) return

    setLoadingAction('message')
    try {
      // Buscar la conversación existente
      const response = await fetch('/api/comunidad/messages')
      if (response.ok) {
        const conversations = await response.json()
        const existingConversation = conversations.find((conv: any) =>
          (conv.match.user1_id === user.id && conv.match.user2_id === profile.user.id) ||
          (conv.match.user2_id === user.id && conv.match.user1_id === profile.user.id)
        )

        if (existingConversation) {
          router.push(`/comunidad/mensajes/${existingConversation.id}`)
        } else {
          // Si no existe, redirigir a la página de mensajes
          router.push('/comunidad/mensajes')
        }
      }
    } catch (error) {
      console.error('Error al acceder a mensajes:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getPreferenceIcon = (key: string, value: boolean) => {
    const icons = {
      pet_friendly: '🐕',
      smoking_allowed: '🚬',
      furnished: '🛋️',
      shared_spaces: '🏠'
    }
    return value ? icons[key as keyof typeof icons] : '❌'
  }

  const getPreferenceLabel = (key: string) => {
    const labels = {
      pet_friendly: 'Mascotas',
      smoking_allowed: 'Fumar',
      furnished: 'Amueblado',
      shared_spaces: 'Espacios compartidos'
    }
    return labels[key as keyof typeof labels]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.user.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {profile.user.name}
                      </h2>
                      <NewUserBadge userCreatedAt={profile.createdAt} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.neighborhood}, {profile.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {profile.age} años
                      </div>
                    </div>
                    <Badge
                      variant={profile.role === 'BUSCO' ? 'default' : 'secondary'}
                      className="mb-4"
                    >
                      {profile.role === 'BUSCO' ? 'Busca vivienda' : 'Ofrece vivienda'}
                    </Badge>
                  </div>

                  {/* Indicador de Match */}
                  {isMatched && (
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-pink-700">
                        💕 ¡Es un Match!
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Presupuesto */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Presupuesto</h3>
                  <p className="text-lg font-semibold text-green-600">
                    {formatBudget(profile.budgetMin)} - {formatBudget(profile.budgetMax)}
                  </p>
                </div>

                {/* Descripción */}
                {profile.bio && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Descripción</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full">
                        {profile.bio}
                      </p>
                    </div>
                  </div>
                )}

                {/* Carrusel de Fotos */}
                {profile.photos && profile.photos.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">
                      Fotos ({profile.photos.length})
                    </h3>
                    <div className="relative">
                      {/* Foto principal */}
                      <div className="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={profile.photos[selectedImageIndex || 0]}
                          alt={`Foto ${(selectedImageIndex || 0) + 1} de ${profile.user.name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        
                        {/* Navegación del carrusel */}
                        {profile.photos.length > 1 && (
                          <>
                            <button
                              onClick={() => setSelectedImageIndex(
                                (selectedImageIndex || 0) > 0 
                                  ? (selectedImageIndex || 0) - 1 
                                  : profile.photos!.length - 1
                              )}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                            >
                              ←
                            </button>
                            <button
                              onClick={() => setSelectedImageIndex(
                                (selectedImageIndex || 0) < profile.photos!.length - 1 
                                  ? (selectedImageIndex || 0) + 1 
                                  : 0
                              )}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                            >
                              →
                            </button>
                            
                            {/* Indicador de posición */}
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                              {(selectedImageIndex || 0) + 1} / {profile.photos.length}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Miniaturas */}
                      {profile.photos.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                          {profile.photos.map((photo, index) => (
                            <div
                              key={index}
                              className={`relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 border-2 transition-all ${
                                (selectedImageIndex || 0) === index 
                                  ? 'border-blue-500 opacity-100' 
                                  : 'border-gray-200 opacity-70 hover:opacity-90'
                              }`}
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <Image
                                src={photo}
                                alt={`Miniatura ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags/Intereses */}
                {profile.tags && profile.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Intereses</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Preferencias</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {profile.petPref && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐕</span>
                      <div>
                        <p className="font-medium text-gray-700">Mascotas</p>
                        <p className="text-sm text-gray-600">{profile.petPref}</p>
                      </div>
                    </div>
                  )}
                  {profile.smokePref && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚬</span>
                      <div>
                        <p className="font-medium text-gray-700">Fumar</p>
                        <p className="text-sm text-gray-600">{profile.smokePref}</p>
                      </div>
                    </div>
                  )}
                  {profile.diet && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍽️</span>
                      <div>
                        <p className="font-medium text-gray-700">Dieta</p>
                        <p className="text-sm text-gray-600">{profile.diet}</p>
                      </div>
                    </div>
                  )}
                  {profile.scheduleNotes && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⏰</span>
                      <div>
                        <p className="font-medium text-gray-700">Horarios</p>
                        <p className="text-sm text-gray-600">{profile.scheduleNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Acciones */}
          <div className="space-y-6">
            {!isOwnProfile && user && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Acciones</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleLike}
                    disabled={loadingAction === 'like'}
                    variant={isLiked ? "default" : "outline"}
                    className="w-full"
                  >
                    {loadingAction === 'like' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    )}
                    {isLiked ? 'Te gusta' : 'Me gusta'}
                  </Button>

                  {isMatched && (
                    <Button
                      onClick={handleMessage}
                      disabled={loadingAction === 'message'}
                      variant="secondary"
                      className="w-full"
                    >
                      {loadingAction === 'message' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                      )}
                      Enviar mensaje
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Información</h3>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium">Miembro desde</p>
                  <p>{new Date(profile.createdAt).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <p className="font-medium">Tipo de perfil</p>
                  <p>{profile.role === 'BUSCO' ? 'Buscando vivienda' : 'Ofreciendo vivienda'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Imagen */}
        {selectedImageIndex !== null && profile.photos && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImageIndex(null)}
                className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="relative w-full h-full max-w-3xl max-h-[80vh]">
                <Image
                  src={profile.photos[selectedImageIndex]}
                  alt={`Foto ${selectedImageIndex + 1} de ${profile.user.name}`}
                  width={800}
                  height={600}
                  className="object-contain w-full h-full rounded-lg"
                />
              </div>

              {/* Navegación entre imágenes */}
              {profile.photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImageIndex(
                      selectedImageIndex > 0 ? selectedImageIndex - 1 : profile.photos!.length - 1
                    )}
                    className="bg-white hover:bg-gray-100"
                  >
                    ←
                  </Button>
                  <span className="bg-white px-3 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {profile.photos.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImageIndex(
                      selectedImageIndex < profile.photos!.length - 1 ? selectedImageIndex + 1 : 0
                    )}
                    className="bg-white hover:bg-gray-100"
                  >
                    →
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
