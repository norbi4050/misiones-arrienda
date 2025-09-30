'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { subscribeToMessages, unsubscribeFromChannel, type MessageRealtimePayload } from '@/lib/realtime-messages'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  created_at: string
  is_read: boolean
}

interface ThreadInfo {
  id: string
  property_id: string
  property_title: string
  property_image?: string
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
}

interface ChatInterfaceProps {
  threadId: string
  onThreadUpdate: () => void
}

export default function ChatInterface({ threadId, onThreadUpdate }: ChatInterfaceProps) {
  const { user } = useSupabaseAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [threadInfo, setThreadInfo] = useState<ThreadInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (threadId && user) {
      loadThread()
      markAsRead()
      setupRealtimeSubscription()
    }

    // Cleanup al cambiar de thread o desmontar
    return () => {
      if (realtimeChannelRef.current) {
        unsubscribeFromChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
    }
  }, [threadId, user])

  // Solo hacer scroll al final en carga inicial o nuevos mensajes enviados
  useEffect(() => {
    if (!loading && !loadingMore) {
      scrollToBottom()
    }
  }, [messages.length, loading])

  const loadThread = async (loadMore = false, cursorParam?: string) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setMessages([])
        setCursor(null)
        setHasMore(true)
      }

      const url = new URL(`/api/messages/threads/${threadId}`, window.location.origin)
      if (cursorParam) {
        url.searchParams.set('cursor', cursorParam)
      }
      url.searchParams.set('limit', '30')

      const response = await fetch(url.toString(), {
        credentials: 'include'
      })

      if (response.status === 401) {
        toast.error('Sesión expirada')
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Error al cargar el hilo')
      }

      const data = await response.json()
      const newMessages = data.messages || []
      
      if (loadMore) {
        // Prepender mensajes más antiguos manteniendo posición de scroll
        const container = messagesContainerRef.current
        const scrollHeightBefore = container?.scrollHeight || 0
        
        setMessages(prev => [...newMessages, ...prev])
        
        // Mantener posición de scroll después de prepender
        setTimeout(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight
            container.scrollTop = scrollHeightAfter - scrollHeightBefore
          }
        }, 0)
      } else {
        // Carga inicial - establecer mensajes y scroll al final
        setMessages(newMessages)
        setThreadInfo(data.thread)
        setTimeout(() => scrollToBottom(), 100)
      }

      // Actualizar cursor y hasMore
      setCursor(data.pagination?.cursor || null)
      setHasMore(data.pagination?.hasMore || false)

    } catch (error) {
      console.error('Error loading thread:', error)
      toast.error('Error al cargar mensajes')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreMessages = () => {
    if (cursor && hasMore && !loadingMore) {
      loadThread(true, cursor)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch(`/api/messages/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_read' })
      })
      // Actualizar lista de threads sin recargar
      onThreadUpdate()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: 'current-user',
      sender_name: 'Tú',
      created_at: new Date().toISOString(),
      is_read: true
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const response = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: messageContent })
      })

      if (response.status === 401) {
        toast.error('Sesión expirada')
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Error al enviar mensaje')
      }

      // Recargar solo los mensajes más recientes para obtener el mensaje confirmado
      await loadThread(false)
      onThreadUpdate() // Actualizar lista de threads
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Error al enviar mensaje')
      // Remover mensaje optimista en caso de error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user || !threadId) return

    // Limpiar suscripción anterior
    if (realtimeChannelRef.current) {
      unsubscribeFromChannel(realtimeChannelRef.current)
    }

    // Suscribirse a mensajes nuevos en este thread
    const channel = subscribeToMessages(
      threadId,
      user.id,
      (newMessage: MessageRealtimePayload) => {
        console.log('🔴 Received real-time message:', newMessage)
        
        // Formatear mensaje para el estado local
        const formattedMessage: Message = {
          id: newMessage.id,
          content: newMessage.content,
          sender_id: newMessage.sender_id,
          sender_name: newMessage.sender?.full_name || 'Usuario',
          sender_avatar: newMessage.sender?.photos?.[0] || undefined,
          created_at: newMessage.created_at,
          is_read: newMessage.is_read
        }

        // Insertar al final de la lista
        setMessages(prev => [...prev, formattedMessage])
        
        // Auto-scroll al final para mensajes nuevos
        setTimeout(() => scrollToBottom(), 100)
        
        // Auto-marcar como leído si el thread está activo
        markAsRead()
        
        // Actualizar lista de threads
        onThreadUpdate()
      }
    )

    realtimeChannelRef.current = channel
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!threadInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">No se pudo cargar la conversación</p>
          <button
            onClick={() => router.push('/messages')}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            Volver a mensajes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header del chat */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/messages')}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            {threadInfo.other_user_avatar ? (
              <img
                src={threadInfo.other_user_avatar}
                alt={threadInfo.other_user_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {threadInfo.other_user_name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {threadInfo.other_user_name}
            </h3>
            <a
              href={`/properties/${threadInfo.property_id}`}
              className="text-sm text-blue-600 hover:text-blue-700 truncate block"
            >
              {threadInfo.property_title}
            </a>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={(e) => {
          const container = e.currentTarget
          // Detectar scroll al tope para cargar más mensajes
          if (container.scrollTop === 0 && hasMore && !loadingMore) {
            loadMoreMessages()
          }
        }}
      >
        {/* Botón "Ver mensajes anteriores" */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {loadingMore ? 'Cargando...' : 'Ver mensajes anteriores'}
            </button>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === 'current-user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === 'current-user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender_id === 'current-user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {new Date(message.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje... (Enter = enviar, Shift+Enter = nueva línea)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter = enviar, Shift+Enter = nueva línea
        </p>
      </div>
    </div>
  )
}
