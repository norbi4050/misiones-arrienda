'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

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

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchConversations()
      
      // Suscribirse a actualizaciones de conversaciones
      import('@/lib/realtime').then(({ subscribeToConversations, unsubscribeFromConversations }) => {
        const channel = subscribeToConversations(user.id, (updatedConversation) => {
          console.log('🔴 Conversación actualizada:', updatedConversation)
          // Recargar lista de conversaciones cuando hay cambios
          fetchConversations()
        })
        
        return () => {
          unsubscribeFromConversations(channel)
        }
      })
    }
  }, [user])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (!response.ok) {
        throw new Error('Error al cargar conversaciones')
      }
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const filteredConversations = conversations.filter((conversation: Conversation) =>
    conversation.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Mensajes
          </h1>
          <p className="text-gray-600">
            {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'}
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
                onClick={() => router.push(`/messages/${conversation.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  {/* Property Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={conversation.property_image || '/placeholder-house-1.jpg'}
                      alt={conversation.property_title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {conversation.property_title}
                      </h3>
                      {conversation.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {conversation.other_user_avatar ? (
                          <img
                            src={conversation.other_user_avatar}
                            alt={conversation.other_user_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {conversation.other_user_name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {conversation.other_user_name}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm truncate mb-2">
                      {conversation.last_message}
                    </p>

                    <p className="text-xs text-gray-400">
                      {new Date(conversation.last_message_time).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <span className="text-gray-400">→</span>
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
