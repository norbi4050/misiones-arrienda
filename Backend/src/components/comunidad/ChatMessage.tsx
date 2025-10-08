'use client'

import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import AvatarUniversal from '@/components/ui/avatar-universal'
import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

// Función simple para formatear tiempo relativo
const formatTimeAgo = (date: string) => {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'ahora'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
  return `${Math.floor(diffInSeconds / 2592000)}mes`
}

interface ChatMessageProps {
  isOwn: boolean
  message: {
    id: string
    content: string
    created_at: string
    sender_id: string
    type: 'text' | 'image' | 'system'
  }
  isFromCurrentUser: boolean
  senderName?: string
  senderDisplayName?: string
  senderAvatarUrl?: string
  showAvatar?: boolean
}

export default function ChatMessage({ 
  message, 
  isFromCurrentUser, 
  senderName,
  senderDisplayName,
  senderAvatarUrl,
  showAvatar = true 
}: ChatMessageProps) {
  const { user } = useSupabaseAuth()
  
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    )
  }

  // Priorizar displayName sobre name, evitar "U" como último recurso
  const displayName = senderDisplayName || senderName || 'Usuario'

  // Log de diagnóstico (solo dev)
  if (process.env.NODE_ENV === 'development') {
    const now = new Date()
    const past = new Date(message.created_at)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
    
    console.info('🔍 ChatMessage DEBUG ->', {
      messageId: message.id,
      content: message.content.substring(0, 30),
      created_at: message.created_at,
      created_at_parsed: past.toISOString(),
      now: now.toISOString(),
      diffInSeconds,
      diffInHours: Math.floor(diffInSeconds / 3600),
      diffInDays: Math.floor(diffInSeconds / 86400),
      formatTimeAgoResult: formatTimeAgo(message.created_at),
      senderDisplayName,
      isFromCurrentUser
    })
  }

  return (
    <div className={cn(
      "flex gap-2 mb-3",
      isFromCurrentUser ? "justify-end" : "justify-start"
    )}>
      {/* Avatar - ✅ FIX: AvatarUniversal para usuario actual, SafeAvatar para otro usuario */}
      {!isFromCurrentUser && showAvatar && (
        <SafeAvatar
          src={senderAvatarUrl || undefined}
          name={displayName}
          size="sm"
        />
      )}

      {/* Mensaje */}
      <div className={cn(
        "max-w-xs lg:max-w-md flex flex-col",
        isFromCurrentUser ? "items-end" : "items-start"
      )}>
        {/* Nombre del remitente (solo para mensajes de otros usuarios) */}
        {!isFromCurrentUser && displayName && (
          <p className="text-xs text-gray-600 mb-1 px-1 font-medium">
            {displayName}
          </p>
        )}

        {/* Contenido del mensaje - BURBUJAS DIFERENCIADAS */}
        <div className={cn(
          "px-4 py-2 rounded-2xl break-words shadow-sm",
          isFromCurrentUser 
            ? "bg-blue-500 text-white rounded-br-md" 
            : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
        )}>
          {message.type === 'image' ? (
            <div className="space-y-2">
              <img 
                src={message.content} 
                alt="Imagen enviada" 
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          "flex items-center gap-1 mt-1 px-1",
          isFromCurrentUser ? "justify-end" : "justify-start"
        )}>
          <Clock className="w-3 h-3 text-gray-400" />
          <span className={cn(
            "text-xs",
            isFromCurrentUser ? "text-blue-600" : "text-gray-500"
          )}>
            {formatTimeAgo(message.created_at)}
          </span>
        </div>
      </div>

      {/* Avatar del usuario actual */}
      {isFromCurrentUser && showAvatar && (
        <AvatarUniversal
          userId={user?.id}
          size="sm"
          fallbackText="Tú"
        />
      )}
    </div>
  )
}
