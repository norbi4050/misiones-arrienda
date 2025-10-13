'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useMessages } from '@/contexts/MessagesContext'
import ChatInterface from '@/components/ui/ChatInterface'
import { SafeImage } from '@/components/ui/SafeImage'
import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { subscribeToConversations, unsubscribeFromChannel, type ConversationRealtimePayload } from '@/lib/realtime-messages'
import { sanitizeDisplayName } from '@/lib/utils/validation'
import type { RealtimeChannel } from '@supabase/supabase-js'
// PROMPT 1 (D3): Importar AvatarNudgeBanner
import { AvatarNudgeBanner } from '@/components/ui/AvatarNudgeBanner'

interface Conversation {
  id: string
  property_id: string
  property_title: string
  property_image?: string
  other_user_name: string
  other_user_avatar?: string
  last_message: string
  last_message_time: string
  unread_count: number
}

type MessageTab = 'properties' | 'community'

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const { deleteConversation } = useMessages()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [creatingThread, setCreatingThread] = useState(false)
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // PROMPT 1 (D3): Estado para modal de avatar
  const [isAvatarUploadModalOpen, setIsAvatarUploadModalOpen] = useState(false)

  // Detectar tab activo desde URL
  const activeTab = (searchParams.get('tab') as MessageTab) || 'properties'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // PROMPT D4: Invalidar caché al cambiar de usuario o tab
  useEffect(() => {
    if (user) {
      fetchConversations()
      
      // Detectar parámetros de la URL
      const userId = searchParams.get('userId')
      const threadId = searchParams.get('thread')
      
      // Prioridad 1: Si hay userId (nuevo flujo desde comunidad)
      if (userId && !threadId) {
        handleCreateThread(userId)
      } 
      // Prioridad 2: Si hay threadId (flujo existente)
      else if (threadId) {
        setSelectedConversationId(threadId)
      }
      
      // Configurar suscripción real-time para actualizaciones de threads (solo para properties)
      if (activeTab === 'properties') {
        setupConversationsRealtime()
      }
    }

    // Cleanup al desmontar
    return () => {
      if (realtimeChannelRef.current) {
        unsubscribeFromChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
    }
  }, [user?.id, activeTab, searchParams])  // PROMPT D4: Dependencia en user.id y activeTab

  const handleCreateThread = async (toUserId: string) => {
    try {
      setCreatingThread(true)
      setError(null)
      
      console.log('[CREATE THREAD] Iniciando conversación con usuario:', toUserId)
      
      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toUserId })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Error al crear conversación')
      }
      
      const data = await response.json()
      
      if (data.success && data.conversationId) {
        console.log('[CREATE THREAD] Thread creado/encontrado:', data.conversationId, 'existing:', data.existing)
        
        // Actualizar URL y abrir thread
        router.push(`/messages/${data.conversationId}`)
        setSelectedConversationId(data.conversationId)
        
        // Refrescar lista de conversaciones
        await fetchConversations()
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (err: any) {
      console.error('[CREATE THREAD] Error:', err)
      setError(err.message || 'Error al iniciar conversación')
    } finally {
      setCreatingThread(false)
    }
  }

  const setupConversationsRealtime = () => {
    if (!user) return

    // Limpiar suscripción anterior
    if (realtimeChannelRef.current) {
      unsubscribeFromChannel(realtimeChannelRef.current)
    }

    // Suscribirse a actualizaciones de conversaciones
    const channel = subscribeToConversations(
      user.id,
      (updatedConversation: ConversationRealtimePayload) => {
        console.log('🔴 Conversation updated via realtime:', updatedConversation)
        
        // Actualizar la conversación específica en el estado
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id === updatedConversation.id) {
              return {
                ...conv,
                last_message: updatedConversation.lastMessage,
                last_message_time: updatedConversation.lastMessageTime,
                unread_count: updatedConversation.unreadCount
              }
            }
            return conv
          })
          
          // Reordenar por last_message_time (más reciente primero)
          return updated.sort((a, b) => 
            new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
          )
        })
      }
    )

    realtimeChannelRef.current = channel
  }

  // PROMPT 1 (D3): Handler para abrir modal de avatar
  const handleAvatarUploadClick = () => {
    console.log('[AvatarNudge] shown - User clicked "Subir avatar"')
    // Opción 1: Abrir modal (si existe)
    setIsAvatarUploadModalOpen(true)
    // Opción 2: Redirigir a perfil
    // router.push('/mi-cuenta/perfil#avatar')
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Determinar endpoint según el tab activo
      // FIX 304: Agregar timestamp para evitar caché
      const timestamp = Date.now()
      const endpoint = activeTab === 'community' 
        ? `/api/comunidad/messages?_t=${timestamp}` 
        : `/api/messages/threads?_t=${timestamp}`
      
      console.log(`[MessagesPage] Fetching conversations from ${endpoint}`)
      
      // FIX 304: Agregar headers anti-caché explícitos
      const response = await fetch(endpoint, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      
      
      // FIX 304: Si recibimos 304, forzar reload completo para bypass cache
      if (response.status === 304) {
        console.warn('[MessagesPage] 304 Not Modified detected - forcing hard reload to bypass cache')
        // Forzar reload con cache bypass
        window.location.reload()
        return
      }
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (!response.ok) {
        throw new Error('Error al cargar conversaciones')
      }
      
      
      // FIX 304: Try-catch robusto para response.json()
      let responseData
      try {
        responseData = await response.json()
      } catch (jsonError) {
        console.error('[MessagesPage] Error parsing JSON:', jsonError)
        throw new Error('Error al procesar respuesta del servidor')
      }
      
      // Manejar respuesta según el endpoint
      if (activeTab === 'community') {
        // Formato de /api/comunidad/messages: { conversations: [...], count: number }
        console.log('[MessagesPage] Community conversations:', responseData.conversations?.length || 0)
        
        // Normalizar conversaciones de comunidad al formato esperado
        const normalizedConversations = (responseData.conversations || []).map((conv: any) => {
          return {
            id: conv.id,
            property_id: '',
            property_title: 'Conversación de Comunidad',
            property_image: null,
            other_user_name: 'Usuario', // TODO: Obtener nombre real del otro usuario
            other_user_avatar: null,
            last_message: 'Conversación activa',
            last_message_time: conv.last_message_at || conv.created_at || new Date().toISOString(),
            unread_count: 0
          }
        })
        
        setConversations(normalizedConversations)
        setLoading(false)
        return
      }
      
      // Formato de /api/messages/threads (propiedades)
      
      // PROMPT 4: Normalización defensiva con logs
      console.log('[MessagesUI] Cargando threads, raw count:', (responseData.threads || []).length)
      console.log('[MessagesUI] Raw threads data:', JSON.stringify(responseData.threads, null, 2))
      
      const normalizedThreads = (responseData.threads || []).map((thread: any) => {
        console.log('[MessagesUI] Processing thread:', thread.conversationId, 'otherUser.avatarUrl:', thread.otherUser?.avatarUrl)
        // PROMPT 4: Garantizar threadId siempre presente
        const conversationId = thread.conversationId || thread.id || `unknown-${Date.now()}`
        
        // PROMPT D3: Sanitizar displayName para garantizar que nunca sea UUID
        const rawDisplayName = thread.otherUser?.displayName || 
                              thread.otherUser?.name || 
                              thread.otherUser?.email?.split('@')[0] ||
                              'Contacto'
        const otherUserDisplayName = sanitizeDisplayName(rawDisplayName)
        
        // PROMPT 3: Snippet con prefijo dinámico "Vos:" o "{displayName}:"
        let lastMessageSnippet = ''
        if (thread.lastMessage?.content) {
          const isMine = Boolean(thread.lastMessage.isMine)  // PROMPT 4: asegurar boolean
          if (isMine) {
            lastMessageSnippet = `Vos: ${thread.lastMessage.content}`
          } else {
            lastMessageSnippet = `${otherUserDisplayName}: ${thread.lastMessage.content}`
          }
        } else {
          lastMessageSnippet = 'Sin mensajes'
        }
        
        // PROMPT 4: Validar fechas como Date o ISO strings
        const updatedAtRaw = thread.updatedAt || thread.lastMessage?.createdAt || new Date().toISOString()
        const updatedAtISO = updatedAtRaw ? new Date(updatedAtRaw).toISOString() : new Date().toISOString()
        
        return {
          id: conversationId,
          property_id: thread.property?.id || thread.propertyId || '',
          property_title: thread.property?.title || 'Conversación',
          property_image: thread.property?.coverUrl || thread.propertyImage || null,
          other_user_name: otherUserDisplayName,  // PROMPT 3: displayName del otro
          other_user_avatar: thread.otherUser?.avatarUrl || thread.otherUser?.avatar || null,
          last_message: lastMessageSnippet,  // PROMPT 3: con prefijo "Vos:" o nombre
          last_message_time: updatedAtISO,  // PROMPT 4: ISO 8601 validada
          unread_count: thread.unreadCount || 0
        }
      })
      
      console.log('[MessagesUI] Threads normalizados:', normalizedThreads.length)
      setConversations(normalizedThreads)
    } catch (err: any) {
      console.error('[MESSAGES] Error fetching conversations:', err)
      setError(err.message)
    } finally {
      // FIX 304: GARANTIZAR que setLoading(false) SIEMPRE se ejecute
      setLoading(false)
    }
  }

  // Cambiar de tab
  const handleTabChange = (tab: MessageTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`/messages?${params.toString()}`)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredConversations = conversations.filter((conversation: Conversation) => {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    const title = (conversation.property_title || '').toLowerCase()
    const userName = (conversation.other_user_name || '').toLowerCase()
    
    return title.includes(search) || userName.includes(search)
  })

  // Loading modal durante creación de thread
  if (creatingThread) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Iniciando conversación
              </h3>
              <p className="text-sm text-gray-600">
                Por favor espera un momento...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si hay un thread seleccionado, mostrar el panel de chat
  if (selectedConversationId) {
    return (
      <div className="h-screen flex bg-gray-50">
        {/* Panel izquierdo - Lista de threads */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          {/* Header del panel izquierdo */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
            <p className="text-sm text-gray-600">
              {searchTerm ? (
                <>
                  {filteredConversations.length} {filteredConversations.length === 1 ? 'resultado' : 'resultados'}
                </>
              ) : (
                <>
                  {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'}
                </>
              )}
            </p>
          </div>

          {/* Search */}
          {conversations.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">🔍</span>
                </div>
              </div>
            </div>
          )}

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {!loading && filteredConversations.map((conversation: Conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group ${
                  selectedConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* PROMPT 3: Avatar del otro usuario */}
                  <div 
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => {
                      console.log('[MessagesUI] Thread seleccionado:', conversation.id)
                      setSelectedConversationId(conversation.id)
                      router.push(`/messages/${conversation.id}`)
                    }}
                  >
                    <SafeAvatar
                      src={conversation.other_user_avatar}
                      name={conversation.other_user_name}
                      size="md"
                    />
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      console.log('[MessagesUI] Thread seleccionado:', conversation.id)
                      setSelectedConversationId(conversation.id)
                      router.push(`/messages/${conversation.id}`)
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {/* PROMPT 3: Título = otherUser.displayName */}
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.other_user_name}
                      </h4>
                      {conversation.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    {/* PROMPT 3: Snippet con prefijo "Vos:" o "{nombre}:" */}
                    <p className="text-xs text-gray-600 truncate font-medium">
                      {conversation.last_message}
                    </p>
                    {/* PROMPT 3: Hora legible */}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(conversation.last_message_time).toLocaleString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {/* Botón eliminar - visible en mobile, hover en desktop */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!confirm('¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.')) {
                        return
                      }
                      
                      const ok = await deleteConversation(conversation.id, 'property')
                      if (ok) {
                        // Si era la conversación seleccionada, deseleccionar
                        if (selectedConversationId === conversation.id) {
                          setSelectedConversationId(null)
                          router.push('/messages')
                        }
                      } else {
                        alert('No se pudo eliminar la conversación')
                      }
                    }}
                    className="md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 active:opacity-100 transition-opacity flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Eliminar conversación"
                    aria-label="Eliminar conversación"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - Chat interface */}
        <div className="flex-1 flex flex-col">
          <ChatInterface conversationId={selectedConversationId} onThreadUpdate={fetchConversations} />
        </div>
      </div>
    )
  }

  // Vista de lista completa cuando no hay thread seleccionado
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PROMPT 1 (D3): Avatar Nudge Banner - Arriba de todo */}
        <AvatarNudgeBanner
          hasAvatar={!!user?.avatar}
          onUploadClick={handleAvatarUploadClick}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Mensajes
          </h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <>
                {filteredConversations.length} {filteredConversations.length === 1 ? 'resultado' : 'resultados'}
                {conversations.length > 0 && ` de ${conversations.length} ${conversations.length === 1 ? 'conversación' : 'conversaciones'}`}
              </>
            ) : (
              <>
                {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'}
              </>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('properties')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Propiedades
            </button>
            <button
              onClick={() => handleTabChange('community')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'community'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Comunidad
            </button>
          </nav>
        </div>

        {/* Search */}
        {conversations.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Cargando conversaciones...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <span className="text-red-600 text-4xl mb-4 block">⚠️</span>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error al cargar mensajes
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && conversations.length === 0 && (
          <div className="text-center py-12">
            <span className="text-gray-400 text-6xl mb-6 block">💬</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes conversaciones aún
            </h3>
            <p className="text-gray-600 mb-6">
              Explora propiedades y envía mensajes a los propietarios
            </p>
            <button
              onClick={() => router.push('/properties')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Explorar Propiedades
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && conversations.length > 0 && filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <span className="text-gray-400 text-6xl mb-6 block">🔍</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta con otros términos de búsqueda
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Conversations List */}
        {!loading && !error && filteredConversations.length > 0 && (
          <div className="space-y-4">
            {filteredConversations.map((conversation: Conversation) => (
              <div
                key={conversation.id}
                className={`group relative bg-white rounded-lg border p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer ${
                  selectedConversationId === conversation.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200'
                }`}
                onClick={() => {
                  console.log('[MessagesUI] Thread seleccionado:', conversation.id)
                  setSelectedConversationId(conversation.id)
                  router.push(`/messages/${conversation.id}`)
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* PROMPT 3 & 6: Avatar del otro usuario */}
                  <div className="flex-shrink-0">
                    <SafeAvatar
                      src={conversation.other_user_avatar}
                      name={conversation.other_user_name}
                      size="lg"
                    />
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      {/* PROMPT 3: Título = otherUser.displayName */}
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {conversation.other_user_name}
                      </h3>
                      {conversation.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    {/* PROMPT 3: Snippet con prefijo "Vos:" o "{nombre}:" */}
                    <p className="text-gray-700 text-sm truncate mb-2 font-medium">
                      {conversation.last_message}
                    </p>

                    {/* PROMPT 3: Fecha legible */}
                    <p className="text-xs text-gray-500">
                      {new Date(conversation.last_message_time).toLocaleString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Acciones a la derecha */}
                  <div className="ml-auto flex items-center gap-2">
                    {/* Botón eliminar - visible en mobile, hover en desktop */}
                    <button
                      type="button"
                      aria-label="Eliminar conversación"
                      title="Eliminar conversación"
                      className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 active:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) return

                        const ok = await deleteConversation(conversation.id, 'property')
                        if (ok) {
                          if (selectedConversationId === conversation.id) {
                            setSelectedConversationId(null)
                            router.push(`/messages?tab=${activeTab}`)
                          }
                        } else {
                          alert('No se pudo eliminar la conversación')
                        }
                      }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    {/* Arrow */}
                    <span className="text-gray-400 text-xl">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
