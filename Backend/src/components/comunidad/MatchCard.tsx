'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, MapPin, Calendar, Clock } from 'lucide-react'
// Función simple para formatear tiempo relativo
const formatTimeAgo = (date: string) => {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'hace un momento'
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`
  if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`
  return `hace ${Math.floor(diffInSeconds / 2592000)} meses`
}

interface MatchCardProps {
  match: {
    id: string
    user1_id: string
    user2_id: string
    status: 'pending' | 'active' | 'inactive'
    created_at: string
    conversation?: {
      id: string
      last_message?: {
        content: string
        created_at: string
        sender_id: string
      }
      unread_count: number
    }
    otherUser: {
      id: string
      name: string
      email: string
      profile: {
        role: 'BUSCO' | 'OFREZCO'
        city: string
        neighborhood: string
        budget_min: number
        budget_max: number
        bio: string
        age: number
      }
    }
  }
  currentUserId: string
  onMessage?: (conversationId: string) => void
  onViewProfile?: (userId: string) => void
}

export default function MatchCard({ 
  match, 
  currentUserId,
  onMessage,
  onViewProfile 
}: MatchCardProps) {
  const { otherUser, conversation } = match
  
  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'pending': return 'Pendiente'
      case 'inactive': return 'Inactivo'
      default: return 'Desconocido'
    }
  }

  const handleMessage = () => {
    if (onMessage && conversation) {
      onMessage(conversation.id)
    }
  }

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(otherUser.id)
    }
  }

  const isFromCurrentUser = conversation?.last_message?.sender_id === currentUserId

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {otherUser.name}
              </h3>
              <Badge 
                variant={otherUser.profile.role === 'BUSCO' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {otherUser.profile.role === 'BUSCO' ? 'Busca' : 'Ofrece'}
              </Badge>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <MapPin className="w-4 h-4 mr-1" />
              {otherUser.profile.neighborhood}, {otherUser.profile.city}
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              {otherUser.profile.age} años
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-xs ${getStatusColor(match.status)}`}>
              {getStatusText(match.status)}
            </Badge>
            
            {conversation && conversation.unread_count > 0 && (
              <Badge variant="destructive" className="text-xs">
                {conversation.unread_count} nuevo{conversation.unread_count > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Presupuesto */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Presupuesto</p>
          <p className="text-sm font-semibold text-green-600">
            {formatBudget(otherUser.profile.budget_min)} - {formatBudget(otherUser.profile.budget_max)}
          </p>
        </div>

        {/* Bio */}
        {otherUser.profile.bio && (
          <div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {otherUser.profile.bio}
            </p>
          </div>
        )}

        {/* Último mensaje */}
        {conversation?.last_message && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-700">
                {isFromCurrentUser ? 'Tú' : otherUser.name}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeAgo(conversation.last_message.created_at)}
              </div>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">
              {conversation.last_message.content}
            </p>
          </div>
        )}

        {/* Match info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <span className="mr-1">💕</span>
            Match {formatTimeAgo(match.created_at)}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewProfile}
            className="flex-1"
          >
            Ver Perfil
          </Button>
          
          {conversation && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMessage}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {conversation.unread_count > 0 ? 'Responder' : 'Mensaje'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
