'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Clock } from 'lucide-react'

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

interface ConversationCardProps {
  lastMessage: string
  conversation: {
    id: string
    match: {
      id: string
      otherUser: {
        id: string
        name: string
        profile: {
          role: 'BUSCO' | 'OFREZCO'
          city: string
          neighborhood: string
        }
      }
    }
    last_message?: {
      id: string
      content: string
      created_at: string
      sender_id: string
    }
    unread_count: number
    updated_at: string
  }
  currentUserId: string
  onClick?: (conversationId: string) => void
}

export default function ConversationCard({
  conversation,
  currentUserId,
  onClick
}: ConversationCardProps) {
  const { match, last_message, unread_count } = conversation
  const { otherUser } = match

  const handleClick = () => {
    if (onClick) {
      onClick(conversation.id)
    }
  }

  const isFromCurrentUser = last_message?.sender_id === currentUserId

  return (
    <Card
      className="w-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {otherUser.name}
              </h3>
              <Badge
                variant={otherUser.profile.role === 'BUSCO' ? 'default' : 'secondary'}
                className="text-xs flex-shrink-0"
              >
                {otherUser.profile.role === 'BUSCO' ? 'Busca' : 'Ofrece'}
              </Badge>
            </div>

            {/* Location */}
            <p className="text-sm text-gray-600 mb-2 truncate">
              {otherUser.profile.neighborhood}, {otherUser.profile.city}
            </p>

            {/* Last message */}
            {last_message ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-gray-600">
                    {isFromCurrentUser ? 'Tú' : otherUser.name}:
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(last_message.created_at)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 pl-6">
                  {last_message.content}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-500 italic">
                  No hay mensajes aún
                </p>
              </div>
            )}
          </div>

          {/* Unread indicator */}
          {unread_count > 0 && (
            <div className="flex flex-col items-end gap-2 ml-3">
              <Badge variant="destructive" className="text-xs">
                {unread_count}
              </Badge>
            </div>
          )}
        </div>

        {/* Match indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">💕</span>
              Match activo
            </div>
            <div className="text-xs text-gray-400">
              {formatTimeAgo(conversation.updated_at)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
