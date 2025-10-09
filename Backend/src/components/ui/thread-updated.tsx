'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { realtimeManager, type MessageRealtimePayload } from '@/lib/supabase/realtime'
import MessageComposer from '@/components/ui/message-composer'
import AvatarUniversal from './avatar-universal'

interface Message {
  id: string
  content: string
  type: 'text' | 'image'
  created_at: string
  read_at?: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
}

interface ThreadProps {
  conversationId: string
  initialMessages?: Message[]
  otherUser?: {
    id: string
    name: string
    avatar?: string
  }
}

export default function Thread({ conversationId, initialMessages = [], otherUser }: ThreadProps) {
  const { user } = useSupabaseAuth()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load messages from API
  const loadMessages = async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/comunidad/messages/${conversationId}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
      } else {
        setError(data.error || 'Error al cargar mensajes')
      }
    } catch (err) {
      console.error('Error loading messages:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const handleSendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    if (!conversationId || !user) return

    try {
      const response = await fetch(`/api/comunidad/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, type })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      // El mensaje se agregará automáticamente via realtime
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }

  // Handle new message from realtime
  const handleNewMessage = (newMessage: MessageRealtimePayload) => {
    setMessages(prev => {
      // Evitar duplicados
      if (prev.some(msg => msg.id === newMessage.id)) {
        return prev
      }

      const message: Message = {
        id: newMessage.id,
        content: newMessage.content,
        type: newMessage.type,
        created_at: newMessage.created_at,
        sender: newMessage.sender || {
          id: newMessage.sender_id,
          name: 'Usuario',
          avatar: undefined
        }
      }

      return [...prev, message]
    })
  }

  // Simple time formatter without date-fns
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  // Setup realtime subscription
  useEffect(() => {
    if (!conversationId || !user) return

    // Subscribe to new messages
    realtimeManager.subscribeToMessages(conversationId, handleNewMessage)

    // Subscribe to presence (optional)
    realtimeManager.subscribeToPresence(conversationId, user.id, (presences) => {
      console.log('Presence updated:', presences)
    })

    return () => {
      realtimeManager.unsubscribe(`messages:${conversationId}`)
      realtimeManager.unsubscribe(`presence:${conversationId}`)
    }
  }, [conversationId, user?.id])

  // Load initial messages if not provided
  useEffect(() => {
    if (initialMessages.length === 0) {
      loadMessages()
    }
  }, [conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Cargando mensajes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={loadMessages}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {otherUser && (
        <div className="border-b bg-white p-4 flex items-center gap-3">
          <AvatarUniversal
            userId={otherUser.id}
            size="md"
            fallbackText={otherUser.name}
          />
          <div>
            <h3 className="font-semibold">{otherUser.name}</h3>
            <p className="text-sm text-gray-500">En línea hace 5 min</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No hay mensajes aún</p>
            <p className="text-sm">¡Envía el primer mensaje!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender.id === user?.id

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isOwn && (
                  <AvatarUniversal
                    userId={message.sender.id}
                    size="sm"
                    fallbackText={message.sender.name}
                  />
                )}

                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`
                      px-4 py-2 rounded-lg
                      ${isOwn 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.created_at)}
                    {isOwn && message.read_at && (
                      <span className="ml-1">• Leído</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
        disabled={!user}
      />
    </div>
  )
}
