'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { realtimeManager, type MessageRealtimePayload } from '@/lib/supabase/realtime'
import MessageComposer from '@/components/ui/message-composer'
import AvatarUniversal from './avatar-universal'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface ThreadProps {
  conversationId: string
  propertyTitle?: string
  otherUserId?: string
  otherUserName?: string
  className?: string
  onNewMessage?: (message: Message) => void
}

export default function Thread({
  conversationId,
  propertyTitle,
  otherUserId,
  otherUserName,
  className = '',
  onNewMessage
}: ThreadProps) {
  const { user } = useSupabaseAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Cargar mensajes de la conversación
  const loadMessages = async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/comunidad/messages/${conversationId}`)

      if (!response.ok) {
        throw new Error('Error al cargar mensajes')
      }

      const data = await response.json()
      
      if (data.messages) {
        setMessages(data.messages || [])
        setTimeout(scrollToBottom, 100)
      } else {
        setError(data.error || 'Error desconocido')
      }

    } catch (err) {
      console.error('Error loading messages:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Agregar nuevo mensaje a la lista
  const addMessage = (newMessage: Message) => {
    setMessages(prev => [...prev, newMessage])
    onNewMessage?.(newMessage)
    setTimeout(scrollToBottom, 100)
  }

  // Formatear fecha del mensaje
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

  // Enviar mensaje via API
  const handleSendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return

    try {
      const response = await fetch(`/api/comunidad/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content.trim(), type: 'text' })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      console.log('✅ Mensaje enviado exitosamente')
      // El mensaje se agregará automáticamente via realtime
    } catch (err) {
      console.error('❌ Error sending message:', err)
      throw err
    }
  }

  // Manejar nuevo mensaje desde realtime
  const handleRealtimeMessage = (newMessage: any) => {
    console.log('🔴 Nuevo mensaje via realtime:', newMessage)
    
    // Evitar duplicados
    setMessages(prev => {
      if (prev.some(msg => msg.id === newMessage.id)) {
        return prev
      }
      
      const message: Message = {
        id: newMessage.id,
        content: newMessage.content,
        sender_id: newMessage.sender_id,
        created_at: newMessage.created_at,
        sender: newMessage.sender
      }
      
      return [...prev, message]
    })
    
    setTimeout(scrollToBottom, 100)
  }

  // Setup realtime subscription
  useEffect(() => {
    if (!conversationId) return

    // Importar dinámicamente para evitar SSR issues
    import('@/lib/realtime').then(({ subscribeToMessages, unsubscribeFromMessages }) => {
      const channel = subscribeToMessages(conversationId, handleRealtimeMessage)
      
      return () => {
        unsubscribeFromMessages(channel)
      }
    })
  }, [conversationId])

  // Cargar mensajes al montar componente
  useEffect(() => {
    loadMessages()
  }, [conversationId])

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando mensajes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <button
          onClick={loadMessages}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header de la conversación */}
      {propertyTitle && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-900 truncate">
            {propertyTitle}
          </h3>
          {otherUserName && (
            <p className="text-sm text-gray-600">
              Conversación con {otherUserName}
            </p>
          )}
        </div>
      )}

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">💬</div>
            <p>No hay mensajes aún</p>
            <p className="text-sm">Envía el primer mensaje para comenzar la conversación</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-2' : 'mr-2'}`}>
                    <AvatarUniversal
                      userId={message.sender_id}
                      size="sm"
                      fallbackText={isOwnMessage ? 'Tú' : otherUserName}
                    />
                  </div>

                  {/* Mensaje */}
                  <div className={`
                    px-4 py-2 rounded-lg
                    ${isOwnMessage 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-900'
                    }
                  `}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`
                      text-xs mt-1
                      ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}
                    `}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Referencia para scroll automático */}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer integrado */}
      <MessageComposer
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
        disabled={!user}
        placeholder="Escribe tu mensaje..."
      />
    </div>
  )
}

// Hook para usar Thread con estado
export function useThread(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  const refreshMessages = async () => {
    // Lógica para recargar mensajes
    setLoading(true)
    // ... implementar recarga
    setLoading(false)
  }

  return {
    messages,
    loading,
    addMessage,
    refreshMessages
  }
}
