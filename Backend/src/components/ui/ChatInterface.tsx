'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileText, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import MessageComposerWithAttachments from '@/components/ui/message-composer-with-attachments'
import React from 'react'

// Helper de log compacto para Realtime
const rtLog = (...args: any[]) => console.log('[RT]', ...args)

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
  conversationId: string
  otherUser: OtherUser  // ← PROMPT 2: info completa del otro usuario
}

interface ChatInterfaceProps {
  conversationId: string
  onThreadUpdate: () => void
}

function ChatInterface({ conversationId, onThreadUpdate }: ChatInterfaceProps) {
  console.log('[MessagesUI] ChatInterface montado con conversationId:', conversationId)
  
  const { user } = useSupabaseAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [threadInfo, setThreadInfo] = useState<ThreadInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // ⛑️ Guardias anti-doble-init y cleanup para Realtime
  const initRef = useRef<string | null>(null)
  const channelRef = useRef<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoizar userId para evitar re-renders innecesarios
  const userId = useMemo(() => user?.id, [user?.id])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const markAsRead = useCallback(async () => {
    try {
      await fetch(`/api/messages/threads/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_read' })
      })
      onThreadUpdate()
    } catch (error) {
      console.error('[MessagesUI] Error marking as read:', error)
    }
  }, [conversationId, onThreadUpdate])

  const loadThread = useCallback(async (loadMore = false, cursorParam?: string) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setMessages([])
        setCursor(null)
        setHasMore(true)
      }

      const url = new URL(`/api/messages/threads/${conversationId}`, window.location.origin)
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
          isMine: Boolean(msg.isMine),
          attachments: msg.attachments || []
        })
      )

      const normalizedThread = data.thread ? {
        conversationId: data.thread.conversationId || conversationId,
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
  }, [conversationId, router, scrollToBottom])

  const loadMoreMessages = useCallback(() => {
    if (cursor && hasMore && !loadingMore) {
      loadThread(true, cursor)
    }
  }, [cursor, hasMore, loadingMore, loadThread])

  const handleSendMessage = useCallback(async (content: string, type?: 'text' | 'image', attachmentIds?: string[]) => {
    if (!content.trim() || !userId) return

    console.log('[MessagesUI] Enviando mensaje con adjuntos:', attachmentIds)

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      createdAt: new Date().toISOString(),
      senderId: userId,
      isMine: true,
      attachments: []
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const body: any = { content }
      if (attachmentIds && attachmentIds.length > 0) {
        body.attachmentIds = attachmentIds
      }

      const response = await fetch(`/api/messages/threads/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      if (response.status === 401) {
        toast.error('Sesión expirada')
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Error al enviar mensaje')
      }

      // ✅ FIX: NO recargar - confiar en optimistic update + realtime
      // El mensaje ya está en la UI (optimistic update)
      // Realtime lo confirmará cuando llegue del servidor
      setTimeout(() => scrollToBottom(), 100)
      onThreadUpdate()
    } catch (error) {
      console.error('[MessagesUI] Error sending message:', error)
      toast.error('Error al enviar mensaje')
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    }
  }, [conversationId, userId, router, scrollToBottom, onThreadUpdate])

  // 🔒 REALTIME SEGURO con feature flag, fallback polling y guardias anti-remount
  useEffect(() => {
    if (!conversationId) return
    
    // 🚫 Guardia: si ya se inicializó para este conversationId, no repetir
    if (initRef.current === conversationId) {
      rtLog('Ya inicializado para', conversationId, '- skipping')
      return
    }
    
    const enableRt = process.env.NEXT_PUBLIC_ENABLE_RT === '1'
    if (!enableRt) {
      rtLog('Realtime deshabilitado por flag')
      return
    }

    // Marcar como inicializado ANTES de crear recursos
    initRef.current = conversationId
    rtLog('Inicializando RT para', conversationId)

    // 🧹 Limpiar cualquier residuo previo
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (channelRef.current) {
      try {
        const supabase = createBrowserSupabase()
        supabase.removeChannel(channelRef.current)
      } catch {}
      channelRef.current = null
    }

    const supabase = createBrowserSupabase()
    let ready = false

    const startPoll = () => {
      if (pollIntervalRef.current) return
      rtLog('Iniciando fallback poll cada 10s')
      pollIntervalRef.current = setInterval(() => {
        loadThread()
      }, 10000)
    }

    const stopPoll = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
        rtLog('Fallback poll detenido')
      }
    }

    rtLog('Suscribiendo a INSERT en public."Message" para conversationId=', conversationId)
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversationId}`
        },
        (payload: any) => {
          const msg = payload.new as any
          rtLog('Nuevo mensaje recibido', { id: msg?.id, senderId: msg?.senderId })

          setMessages((prev: Message[]) => {
            if (!msg?.id) return prev
            if (prev.some((m) => m.id === msg.id)) return prev
            
            const formattedMessage: Message = {
              id: msg.id,
              content: msg.content || '',
              createdAt: msg.createdAt || new Date().toISOString(),
              senderId: msg.senderId || '',
              isMine: msg.senderId === userId,
              attachments: msg.attachments || []
            }
            
            setTimeout(() => scrollToBottom(), 100)
            markAsRead()
            onThreadUpdate()
            
            return [...prev, formattedMessage]
          })
        }
      )
      .subscribe((status: string) => {
        rtLog('Estado canal:', status)
        if (status === 'SUBSCRIBED') {
          ready = true
          stopPoll()
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          startPoll()
        }
      })

    // Guardar canal en ref
    channelRef.current = channel

    // Si en 3s no está listo, arrancar fallback
    fallbackTimeoutRef.current = setTimeout(() => {
      if (!ready) startPoll()
    }, 3000)

    return () => {
      rtLog('Cleanup para', conversationId)
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }
      stopPoll()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      initRef.current = null
    }
  }, [conversationId, userId, loadThread, scrollToBottom, markAsRead, onThreadUpdate])

  useEffect(() => {
    if (conversationId && userId) {
      console.log('[MessagesUI] Inicializando conversacion:', conversationId)
      loadThread()
      markAsRead()
    }
  }, [conversationId, userId, loadThread, markAsRead])

  useEffect(() => {
    if (!loading && !loadingMore) {
      scrollToBottom()
    }
  }, [messages.length, loading, loadingMore, scrollToBottom])

  // PROMPT 2 & 6: Helper para agrupar mensajes consecutivos del mismo autor
  const groupMessages = useCallback((messages: Message[]) => {
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
  }, [])

  // PROMPT 6: Helper para separadores de fecha
  const getDateSeparator = useCallback((dateStr: string) => {
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
  }, [])

  // PROMPT 6: Helper para detectar cambio de día
  const shouldShowDateSeparator = useCallback((currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true
    
    const currentDate = new Date(currentMsg.createdAt).toDateString()
    const prevDate = new Date(prevMsg.createdAt).toDateString()
    
    return currentDate !== prevDate
  }, [])

  const messageGroups = useMemo(() => groupMessages(messages), [messages, groupMessages])

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
                        {/* Adjuntos */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {message.attachments.map((att: any) => {
                              const isImage = att.mime?.startsWith('image/')
                              const isPdf = att.mime === 'application/pdf'
                              
                              const handleDownload = (e: React.MouseEvent) => {
                                e.preventDefault()
                                e.stopPropagation()
                                
                                if (!att.url) {
                                  toast.error('URL de descarga no disponible')
                                  console.error('[Download] No URL available for attachment:', att.id)
                                  return
                                }
                                
                                console.log('[Download] Iniciando descarga:', {
                                  id: att.id,
                                  fileName: att.fileName,
                                  url: att.url,
                                  hasDownloadParam: att.url.includes('download=')
                                })
                                
                                // La URL ya viene con el parámetro download desde el backend
                                // Solo necesitamos abrir la URL y el navegador la descargará automáticamente
                                window.location.href = att.url
                                toast.success('Descargando archivo...')
                              }
                              
                              return (
                                <button
                                  key={att.id}
                                  onClick={handleDownload}
                                  className={`
                                    flex items-center gap-2 p-2 rounded-lg cursor-pointer w-full
                                    ${isMine ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-100 hover:bg-gray-200'}
                                    transition-colors
                                  `}
                                >
                                  {isImage ? (
                                    <ImageIcon className={`h-4 w-4 ${isMine ? 'text-blue-100' : 'text-gray-600'}`} />
                                  ) : isPdf ? (
                                    <FileText className={`h-4 w-4 ${isMine ? 'text-blue-100' : 'text-red-600'}`} />
                                  ) : (
                                    <FileText className={`h-4 w-4 ${isMine ? 'text-blue-100' : 'text-gray-600'}`} />
                                  )}
                                  <span className={`text-xs truncate flex-1 text-left ${isMine ? 'text-blue-50' : 'text-gray-700'}`}>
                                    {att.fileName || 'Archivo'}
                                  </span>
                                  <Download className={`h-3 w-3 ${isMine ? 'text-blue-100' : 'text-gray-500'}`} />
                                </button>
                              )
                            })}
                          </div>
                        )}

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

      {/* Message Composer con soporte de adjuntos */}
      <MessageComposerWithAttachments
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
        placeholder="Escribe tu mensaje..."
        maxLength={1000}
        planTier="free"
      />
    </div>
  )
}

// Envolver con React.memo para prevenir re-renders innecesarios
// Solo re-renderizar si threadId cambia
export default React.memo(ChatInterface, (prevProps, nextProps) => {
  return prevProps.conversationId === nextProps.conversationId
})
