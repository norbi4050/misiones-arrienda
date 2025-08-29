import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
'use client'

import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

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
  showAvatar?: boolean
}

export default function ChatMessage({ 
  message, 
  isFromCurrentUser, 
  senderName,
  showAvatar = true 
}: ChatMessageProps) {
  
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isFromCurrentUser ? "justify-end" : "justify-start"
    )}>
      {/* Avatar (solo para mensajes de otros usuarios) */}
      {!isFromCurrentUser && showAvatar && (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {senderName?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}

      {/* Mensaje */}
      <div className={cn(
        "max-w-xs lg:max-w-md",
        isFromCurrentUser ? "order-1" : "order-2"
      )}>
        {/* Nombre del remitente (solo para mensajes de otros usuarios) */}
        {!isFromCurrentUser && senderName && (
          <p className="text-xs text-gray-500 mb-1 px-1">
            {senderName}
          </p>
        )}

        {/* Contenido del mensaje */}
        <div className={cn(
          "px-4 py-2 rounded-2xl break-words",
          isFromCurrentUser 
            ? "bg-blue-500 text-white rounded-br-md" 
            : "bg-gray-100 text-gray-900 rounded-bl-md"
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
          <span className="text-xs text-gray-400">
            {formatTimeAgo(message.created_at)}
          </span>
        </div>
      </div>

      {/* Espaciador para mensajes del usuario actual */}
      {isFromCurrentUser && showAvatar && (
        <div className="w-8 flex-shrink-0" />
      )}
    </div>
  )
}
