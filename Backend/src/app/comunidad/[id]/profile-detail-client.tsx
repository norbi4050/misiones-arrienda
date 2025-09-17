'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heart, MessageCircle, MapPin, Calendar, ArrowLeft, Loader2 } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

interface ProfileDetailClientProps {
  profile: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    role: 'BUSCO' | 'OFREZCO'
    city: string
    neighborhood: string
    budget_min: number
    budget_max: number
    bio: string
    age: number
    tags: string[]
    preferences: {
      pet_friendly: boolean
      smoking_allowed: boolean
      furnished: boolean
      shared_spaces: boolean
    }
    created_at: string
  }
}

export default function ProfileDetailClient({ profile }: ProfileDetailClientProps) {
  const router = useRouter()
  const { user } = useSupabaseAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'like' | 'message' | null>(null)

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
            Perfil de {profile.user.name}
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {profile.user.name}
                    </h2>
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
                    {formatBudget(profile.budget_min)} - {formatBudget(profile.budget_max)}
                  </p>
                </div>

                {/* Descripción */}
                {profile.bio && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Descripción</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {profile.bio}
                    </p>
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
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(profile.preferences).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getPreferenceIcon(key, value)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-700">
                          {getPreferenceLabel(key)}
                        </p>
                        <p className={`text-sm ${value ? 'text-green-600' : 'text-red-500'}`}>
                          {value ? 'Sí' : 'No'}
                        </p>
                      </div>
                    </div>
                  ))}
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
                  <p>{new Date(profile.created_at).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <p className="font-medium">Tipo de perfil</p>
                  <p>{profile.role === 'BUSCO' ? 'Buscando vivienda' : 'Ofreciendo vivienda'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
