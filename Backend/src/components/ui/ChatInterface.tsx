'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { subscribeToMessages, unsubscribeFromChannel, type MessageRealtimePayload } from '@/lib/realtime-messages'
import type { RealtimeChannel } from '@supabase/supabase-js'

// PROMPT 2: Interfaces actualizadas con isMine y otherUser
interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  isMine: boolean  // ← PROMPT 1: calculado en backend
  attachments?: any[]
}

interface OtherUser {
  id: string
  displayName: string  // ← PROMPT 1: nunca "Usuario"
  avatarUrl: string | null
}

interface ThreadInfo {
  threadId: string
  otherUser: OtherUser  // ← PROMPT 2: info completa del otro usuario
}

interface ChatInterfaceProps {
  threadId: string
  onThreadUpdate: () => void
}

export default function ChatInterface({ threadId, onThreadUpdate }: ChatInterfaceProps) {
  console.log('[MessagesUI] ChatInterface montado con threadId:', threadId)
  
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
      console.log('[MessagesUI] Cargando thread:', threadId)
      loadThread()
      markAsRead()
      setupRealtimeSubscription()
    }

    return () => {
      if (realtimeChannelRef.current) {
        unsubscribeFromChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
    }
  }, [threadId, user])

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
      
      // PROMPT 4: Normalización defensiva
      const normalizedMessages = (data.messages || []).map((msg: any) => ({
        id: msg.id || `temp-${Date.now()}`,
        content: msg.content || '',
        createdAt: msg.createdAt || new Date().toISOString(),
        senderId: msg.senderId || '',
        isMine: Boolean(msg.isMine),  // ← Asegurar boolean
        attachments: msg.attachments || []
      }))

      const normalizedThread = data.thread ? {
        threadId: data.thread.threadId || threadId,
        otherUser: {
          id: data.thread.otherUser?.id || '',
          displayName: data.thread.otherUser?.displayName || 'Usuario',
          avatarUrl: data.thread.otherUser?.avatarUrl || null
        }
      } : null
      
      if (loadMore) {
        const container = messagesContainerRef.current
        const scrollHeightBefore = container?.scrollHeight || 0
        
        setMessages(prev => [...normalizedMessages, ...prev])
        
        setTimeout(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight
            container.scrollTop = scrollHeightAfter - scrollHeightBefore
          }
        }, 0)
      } else {
        setMessages(normalizedMessages)
        setThreadInfo(normalizedThread)
        console.log('[MessagesUI] Thread cargado:', normalizedThread)
        setTimeout(() => scrollToBottom(), 100)
      }

      setCursor(data.pagination?.cursor || null)
      setHasMore(data.pagination?.hasMore || false)

    } catch (error) {
      console.error('[MessagesUI] Error loading thread:', error)
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
      onThreadUpdate()
    } catch (error) {
      console.error('[MessagesUI] Error marking as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    console.log('[MessagesUI] Enviando mensaje')
    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      createdAt: new Date().toISOString(),
      senderId: user?.id || '',
      isMine: true,
      attachments: []
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

      await loadThread(false)
      onThreadUpdate()
    } catch (error) {
      console.error('[MessagesUI] Error sending message:', error)
      toast.error('Error al enviar mensaje')
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

    if (realtimeChannelRef.current) {
      unsubscribeFromChannel(realtimeChannelRef.current)
    }

    const channel = subscribeToMessages(
      threadId,
      user.id,
      (newMessage: MessageRealtimePayload) => {
        console.log('[MessagesUI] Mensaje real-time recibido:', newMessage.id)
        
        const formattedMessage: Message = {
          id: newMessage.id,
          content: newMessage.content,
          createdAt: newMessage.created_at,
          senderId: newMessage.sender_id,
          isMine: newMessage.sender_id === user.id,
          attachments: []
        }

        setMessages(prev => [...prev, formattedMessage])
        setTimeout(() => scrollToBottom(), 100)
        markAsRead()
        onThreadUpdate()
      }
    )

    realtimeChannelRef.current = channel
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // PROMPT 2 & 6: Helper para agrupar mensajes consecutivos del mismo autor
  const groupMessages = (messages: Message[]) => {
    const groups: Message[][] = []
    let currentGroup: Message[] = []
    let lastSenderId: string | null = null

    messages.forEach((msg) => {
      if (msg.senderId !== lastSenderId) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [msg]
        lastSenderId = msg.senderId
      } else {
        currentGroup.push(msg)
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  // PROMPT 6: Helper para separadores de fecha
  const getDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  // PROMPT 6: Helper para detectar cambio de día
  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true
    
    const currentDate = new Date(currentMsg.createdAt).toDateString()
    const prevDate = new Date(prevMsg.createdAt).toDateString()
    
    return currentDate !== prevDate
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

  const messageGroups = groupMessages(messages)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* PROMPT 2: Header con otherUser.displayName y avatarUrl */}
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/messages')}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Volver a mensajes"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* PROMPT 2: Avatar del otro usuario */}
          <SafeAvatar
            src={threadInfo.otherUser.avatarUrl}
            name={threadInfo.otherUser.displayName}
            size="md"
          />
          
          <div className="flex-1 min-w-0">
            {/* PROMPT 2: displayName del otro usuario (nunca "Usuario") */}
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {threadInfo.otherUser.displayName}
            </h3>
            <p className="text-sm text-gray-500">
              Conversación
            </p>
          </div>
        </div>
      </div>

      {/* PROMPT 2 & 6: Mensajes con burbujas claras y agrupación */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        onScroll={(e) => {
          const container = e.currentTarget
          if (container.scrollTop === 0 && hasMore && !loadingMore) {
            loadMoreMessages()
          }
        }}
      >
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 font-medium"
            >
              {loadingMore ? 'Cargando...' : '↑ Ver mensajes anteriores'}
            </button>
          </div>
        )}

        {messageGroups.map((group, groupIndex) => {
          const firstMessage = group[0]
          const isMine = firstMessage.isMine
          const prevMessage = groupIndex > 0 ? messageGroups[groupIndex - 1][0] : null
          const showDateSeparator = shouldShowDateSeparator(firstMessage, prevMessage)

          return (
            <div key={`group-${groupIndex}`}>
              {/* PROMPT 6: Separador de fecha */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                    {getDateSeparator(firstMessage.createdAt)}
                  </div>
                </div>
              )}

              {/* PROMPT 2: Grupo de mensajes del mismo autor */}
              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-4`}>
                {/* PROMPT 2: Etiqueta con nombre (solo para mensajes del otro, solo en primer mensaje del grupo) */}
                {!isMine && (
                  <div className="flex items-center space-x-2 mb-1 ml-12">
                    <span className="text-xs font-medium text-gray-600">
                      {threadInfo.otherUser.displayName}
                    </span>
                  </div>
                )}

                {/* Mensajes del grupo */}
                <div className="space-y-1">
                  {group.map((message, msgIndex) => (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                    >
                      {/* PROMPT 2: Avatar solo para mensajes del otro, solo en último mensaje del grupo */}
                      {!isMine && msgIndex === group.length - 1 && (
                        <SafeAvatar
                          src={threadInfo.otherUser.avatarUrl}
                          name={threadInfo.otherUser.displayName}
                          size="sm"
                          className="flex-shrink-0"
                        />
                      )}
                      {!isMine && msgIndex !== group.length - 1 && (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      {/* PROMPT 2 & 6: Burbuja con esquinas redondeadas y colores distintos */}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 ${
                          isMine
                            ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'  // ← PROMPT 6: más redondeo en extremo externo
                            : 'bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        
                        {/* PROMPT 2: Hora legible (HH:mm) */}
                        <p
                          className={`text-xs mt-1 ${
                            isMine ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
        
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
            placeholder="Escribe tu mensaje..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={2}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            aria-label="Enviar mensaje"
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
