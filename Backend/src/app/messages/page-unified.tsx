'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useUnifiedMessages } from '@/hooks/useUnifiedMessages'
import { MessageTabs, ConversationBadge } from '@/components/messages'
import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { AvatarNudgeBanner } from '@/components/ui/AvatarNudgeBanner'
import ChatInterface from '@/components/ui/ChatInterface'
import type { UnifiedMessageFilter, UnifiedConversation, MessageType } from '@/types/messages'

export default function UnifiedMessagesPage() {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Estado de tabs
  const [activeTab, setActiveTab] = useState<UnifiedMessageFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [selectedThreadType, setSelectedThreadType] = useState<MessageType | null>(null)
  
  // Obtener conversaciones unificadas
  const { conversations, loading, error, counts, refetch } = useUnifiedMessages(activeTab)

  // Detectar tab inicial desde URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'properties' || tabParam === 'community') {
      setActiveTab(tabParam)
    }
    
    const threadParam = searchParams.get('thread')
    if (threadParam) {
      setSelectedThreadId(threadParam)
    }
  }, [searchParams])

  // Redirect si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Handler para cambio de tab
  const handleTabChange = (tab: UnifiedMessageFilter) => {
    setActiveTab(tab)
    setSelectedThreadId(null)
    router.push(`/messages?tab=${tab}`)
  }

  // Handler para seleccionar thread
  const handleSelectThread = (conversation: UnifiedConversation) => {
    setSelectedThreadId(conversation.id)
    setSelectedThreadType(conversation.type)
    router.push(`/messages?tab=${activeTab}&thread=${conversation.id}`)
  }

  // Handler para eliminar conversación
  const handleDeleteConversation = async (id: string, type: MessageType) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const endpoint = type === 'property' 
        ? `/api/messages/threads/${id}/delete`
        : `/api/comunidad/messages/${id}/delete`

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Error al eliminar conversación')
      }

      // Refrescar lista
      await refetch()

      // Si era la conversación seleccionada, deseleccionar
      if (selectedThreadId === id) {
        setSelectedThreadId(null)
        setSelectedThreadType(null)
        router.push(`/messages?tab=${activeTab}`)
      }
    } catch (err: any) {
      console.error('[DELETE] Error:', err)
      alert(err.message || 'Error al eliminar conversación')
    }
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

  // Filtrar por búsqueda
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    const displayName = (conversation.otherUser.displayName || '').toLowerCase()
    const propertyTitle = (conversation.property?.title || '').toLowerCase()
    
    return displayName.includes(search) || propertyTitle.includes(search)
  })

  // Vista con thread seleccionado (split view)
  if (selectedThreadId && selectedThreadType) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Tabs */}
        <MessageTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Panel izquierdo - Lista de threads */}
          <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
              <p className="text-sm text-gray-600">
                {filteredConversations.length} {filteredConversations.length === 1 ? 'conversación' : 'conversaciones'}
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

              {!loading && filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer ${
                    selectedThreadId === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleSelectThread(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <SafeAvatar
                      src={conversation.otherUser.avatarUrl}
                      name={conversation.otherUser.displayName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {conversation.otherUser.displayName}
                        </h4>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <ConversationBadge type={conversation.type} className="mb-1" />
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-600 truncate font-medium">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(conversation.updatedAt).toLocaleString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conversation.id, conversation.type)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Eliminar conversación"
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
            <ChatInterface conversationId={selectedThreadId} onThreadUpdate={refetch} />
          </div>
        </div>
      </div>
    )
  }

  // Vista de lista completa (sin thread seleccionado)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tabs */}
      <MessageTabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={counts}
      />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Avatar Nudge Banner */}
          <AvatarNudgeBanner
            hasAvatar={!!user?.avatar}
            onUploadClick={() => router.push('/mi-cuenta/perfil#avatar')}
            className="mb-6"
          />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Mensajes
            </h1>
            <p className="text-gray-600">
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
                onClick={() => refetch()}
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
                Explora propiedades o la comunidad para empezar a chatear
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/properties')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Explorar Propiedades
                </button>
                <button
                  onClick={() => router.push('/comunidad')}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Explorar Comunidad
                </button>
              </div>
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
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectThread(conversation)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <SafeAvatar
                        src={conversation.otherUser.avatarUrl}
                        name={conversation.otherUser.displayName}
                        size="lg"
                      />
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {conversation.otherUser.displayName}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Badge de tipo */}
                      <ConversationBadge type={conversation.type} className="mb-2" />

                      {/* Último mensaje */}
                      {conversation.lastMessage && (
                        <p className="text-gray-700 text-sm truncate mb-2 font-medium">
                          {conversation.lastMessage.content}
                        </p>
                      )}

                      {/* Fecha */}
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.updatedAt).toLocaleString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      {/* Info de propiedad si existe */}
                      {conversation.property && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          📍 {conversation.property.title}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 self-center">
                      <span className="text-gray-400 text-xl">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
