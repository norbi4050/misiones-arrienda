'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Clock } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { memo } from 'react'

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

type ConversationLite = {
  id: string
  participants: string[]
  otherParticipant: string // UUID
  created_at?: string | null
  last_message_at?: string | null
  last_message_content?: string
  unread_count?: number
  updated_at?: string
}

interface ConversationCardProps {
  conversation: ConversationLite
  currentUserId: string
}

// Memoize el componente para evitar re-renders innecesarios
const ConversationCard = memo(function ConversationCard({
  conversation,
  currentUserId
}: ConversationCardProps) {
  const router = useRouter()
  const { profile, loading } = useProfile(conversation.otherParticipant)

  const handleClick = () => {
    router.push(`/comunidad/mensajes/${conversation.id}`)
  }

  const name = profile?.display_name ?? 'Usuario'
  const initial = (name[0] ?? 'U').toUpperCase()
  const avatarUrl = profile?.avatar_url

  // Mostrar skeleton mientras carga
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header con avatar */}
            <div className="flex items-center gap-3 mb-2">
              {/* Avatar */}
              <div className="flex-shrink-0 relative w-10 h-10">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {initial}
                    </span>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {name}
                </h3>
              </div>
            </div>

            {/* Last message */}
            {conversation.last_message_content ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(conversation.last_message_at || conversation.updated_at || conversation.created_at || new Date().toISOString())}
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 pl-6">
                  {conversation.last_message_content}
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
          {(conversation.unread_count ?? 0) > 0 && (
            <div className="flex flex-col items-end gap-2 ml-3">
              <Badge variant="destructive" className="text-xs">
                {conversation.unread_count}
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
              {formatTimeAgo(conversation.updated_at || conversation.created_at || new Date().toISOString())}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default ConversationCard
