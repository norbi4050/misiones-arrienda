'use client'

import { useState, useRef, useEffect } from 'react'
import ThreadHeader from './ThreadHeader'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { useRealtimePresence } from '@/lib/realtime/presence'
import { getPresenceMode } from '@/utils/env'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  content: string
  type: 'text' | 'image' | 'system'
  created_at: string
  sender_id: string
  sender: {
    id: string
    name?: string
    avatar?: string
    displayName?: string
    avatarUrl?: string
    profileUpdatedAt?: string
  }
}

interface ThreadViewProps {
  conversation: {
    id: string
    user1_id?: string
    user2_id?: string
    match?: {
      id: string
      status: string
    } | null
    otherParticipant?: {
      userId: string
      displayName: string
      avatarUrl?: string | null
      profileUpdatedAt?: string | number | null
      presence?: {
        isOnline: boolean
        lastSeen: string | null
        lastActivity: string
      }
    }
    participants?: Array<{
      userId: string
      displayName: string
      avatarUrl?: string | null
      profileUpdatedAt?: string | number | null
    }>
  }
  messages: Message[]
  currentUserId: string
}

export default function ThreadView({ 
  conversation, 
  messages: initialMessages,
  currentUserId 
}: ThreadViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  
  // ✅ Realtime Presence (solo si modo === 'realtime')
  const presenceMode = getPresenceMode()
  const { state: presenceState } = presenceMode === 'realtime' && user?.id
    ? useRealtimePresence(
        `conversation:${conversation.id}`,
        user.id,
        { displayName: user.name || 'Usuario' }
      )
    : { state: {} as Record<string, any> }

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    setSending(true)
    try {
      const response = await fetch(
        `/api/comunidad/messages/${conversation.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, type: 'text' })
        }
      )
      
      if (response.ok) {
        const { message } = await response.json()
        setMessages(prev => [...prev, message])
      } else {
        const error = await response.json()
        console.error('Error sending message:', error)
        alert(error.error || 'Error al enviar mensaje')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error de conexión al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  // Determinar si el match está activo
  const isMatchActive = conversation.match?.status === 'active'

  // Obtener datos del otro participante
  const otherParticipant = conversation.otherParticipant || {
    userId: '',
    displayName: 'Usuario',
    avatarUrl: null,
    profileUpdatedAt: null
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <ThreadHeader 
        participant={otherParticipant}
        matchStatus={conversation.match?.status}
        conversationId={conversation.id}
        presenceState={presenceMode === 'realtime' ? presenceState : undefined}
      />
      
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No hay mensajes aún. ¡Inicia la conversación!
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isFromCurrentUser = msg.sender_id === currentUserId || msg.sender?.id === currentUserId
            
            // Log de diagnóstico (solo dev)
            if (process.env.NODE_ENV === 'development') {
              console.info('🔍 ThreadView message.sender ->', msg.sender)
            }
            
            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={isFromCurrentUser}
                isFromCurrentUser={isFromCurrentUser}
                senderName={msg.sender?.name}
                senderDisplayName={msg.sender?.displayName}
                senderAvatarUrl={msg.sender?.avatarUrl}
                showAvatar={true}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      {!isMatchActive && (
        <div className="bg-yellow-50 border-t border-yellow-200 p-4 text-center text-sm text-yellow-800">
          Este match ya no está activo. No puedes enviar más mensajes.
        </div>
      )}
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={sending || !isMatchActive}
        placeholder={
          isMatchActive 
            ? "Escribe un mensaje..." 
            : "Match inactivo"
        }
      />
    </div>
  )
}
