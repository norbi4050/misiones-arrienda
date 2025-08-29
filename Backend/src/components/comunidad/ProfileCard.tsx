'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, MapPin, Calendar } from 'lucide-react'
import { useState, useCallback } from 'react'

interface ProfileCardProps {
  profile: {
    id: string
    user: {
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
  isLiked?: boolean
  isMatched?: boolean
  onLike?: (profileId: string) => void
  onMessage?: (profileId: string) => void
  showActions?: boolean
}

export default function ProfileCard({ 
  profile, 
  isLiked = false, 
  isMatched = false,
  onLike,
  onMessage,
  showActions = true 
}: ProfileCardProps) {
  const [liked, setLiked] = useState(isLiked)
  const [loading, setLoading] = useState(false)

  const handleLike = useCallback(async () => {
    if (!onLike || loading) return
    
    setLoading(true)
    try {
      await onLike(profile.id)
      setLiked(!liked)
    } catch (error) {
      console.error('Error al dar like:', error)
    } finally {
      setLoading(false)
    }
  }, [onLike, loading, profile.id, liked])

  const handleMessage = useCallback(() => {
    if (onMessage) {
      onMessage(profile.id)
    }
  }, [onMessage, profile.id])

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
    <Card className="w-full max-w-md mx-auto hover:shadow-lg transition-shadow" data-testid="profile-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900" data-testid="profile-name">
              {profile.user.name}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-1" data-testid="profile-location">
              <MapPin className="w-4 h-4 mr-1" />
              {profile.neighborhood}, {profile.city}
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Calendar className="w-4 h-4 mr-1" />
              {profile.age} años
            </div>
          </div>
          <Badge 
            variant={profile.role === 'BUSCO' ? 'default' : 'secondary'}
            className="ml-2"
          >
            {profile.role === 'BUSCO' ? 'Busca' : 'Ofrece'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Presupuesto */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Presupuesto</p>
          <p className="text-lg font-semibold text-green-600">
            {formatBudget(profile.budget_min)} - {formatBudget(profile.budget_max)}
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
            <p className="text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
          </div>
        )}

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Intereses</p>
            <div className="flex flex-wrap gap-1">
              {profile.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Preferencias */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Preferencias</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(profile.preferences).map(([key, value]) => (
              <div key={key} className="flex items-center text-xs">
                <span className="mr-1">
                  {getPreferenceIcon(key, value)}
                </span>
                <span className={value ? 'text-green-600' : 'text-red-500'}>
                  {getPreferenceLabel(key)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={loading}
              className="flex-1"
            >
              <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
              {liked ? 'Te gusta' : 'Me gusta'}
            </Button>
            
            {isMatched && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMessage}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Mensaje
              </Button>
            )}
          </div>
        )}

        {/* Indicador de Match */}
        {isMatched && (
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-2 text-center">
            <p className="text-sm font-medium text-pink-700">
              💕 ¡Es un Match!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
