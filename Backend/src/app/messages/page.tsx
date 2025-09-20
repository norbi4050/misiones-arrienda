"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Search, MessageCircle, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useMessages } from '@/contexts/MessagesContext'
import Link from 'next/link'

export default function MessagesPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth()
  const { 
    conversations, 
    activeConversationId,
    unreadCount,
    isLoading, 
    error, 
    refreshInbox,
    setActiveConversation,
    markAsRead
  } = useMessages()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/messages')
    }
  }, [isAuthenticated, authLoading, router])

  // Filtrar conversaciones por búsqueda
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      conv.other_user.name.toLowerCase().includes(searchLower) ||
      conv.last_message_content.toLowerCase().includes(searchLower)
    )
  })

  // Manejar selección de conversación
  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId)
    setActiveConversation(conversationId)
    
    // Marcar como leído
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation && conversation.unread_count > 0) {
      await markAsRead(conversationId)
    }
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando tus mensajes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null // El useEffect ya redirige
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost" size="sm">
                  ← Volver a Propiedades
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mis Mensajes</h1>
                  <p className="text-gray-600">
                    {conversations.length === 0 
                      ? 'No tienes conversaciones aún'
                      : `${conversations.length} ${conversations.length === 1 ? 'conversación' : 'conversaciones'}`
                    }
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {unreadCount} sin leer
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshInbox}
                disabled={isLoading}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error state */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700">Error al cargar mensajes: {error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshInbox}
                  className="ml-auto"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {conversations.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No tienes mensajes aún
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Explora propiedades y contacta a los propietarios para comenzar una conversación 💬
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties">
                <Button className="w-full sm:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Explorar Propiedades
                </Button>
              </Link>
              <Link href="/favorites">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Heart className="w-4 h-4 mr-2" />
                  Ver Favoritos
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Messages interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations list */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Conversaciones</CardTitle>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Buscar conversaciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation.id)}
                          className={`p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
                            selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              {conversation.other_user.avatar ? (
                                <img 
                                  src={conversation.other_user.avatar} 
                                  alt={conversation.other_user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {conversation.other_user.name}
                                </h3>
                                {conversation.unread_count > 0 && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                    {conversation.unread_count}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 truncate mb-1">
                                {conversation.last_message_content}
                              </p>
                              
                              <p className="text-xs text-gray-400">
                                {new Date(conversation.last_message_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat area */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                {selectedConversation ? (
                  /* Chat interface */
                  <div className="h-full flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const conv = conversations.find(c => c.id === selectedConversation)
                          return conv ? (
                            <>
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {conv.other_user.avatar ? (
                                  <img 
                                    src={conv.other_user.avatar} 
                                    alt={conv.other_user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {conv.other_user.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Conversación sobre propiedad
                                </p>
                              </div>
                            </>
                          ) : null
                        })()}
                      </div>
                    </CardHeader>

                    {/* Messages area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Selecciona una conversación para ver los mensajes</p>
                        <p className="text-sm mt-2">
                          Esta funcionalidad se completará en la siguiente iteración
                        </p>
                      </div>
                    </div>

                    {/* Message input */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Escribe tu mensaje..."
                          className="flex-1"
                          disabled
                        />
                        <Button disabled>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* No conversation selected */
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Selecciona una conversación
                      </h3>
                      <p className="text-gray-600">
                        Elige una conversación de la lista para ver los mensajes
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Quick actions footer */}
        {conversations.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
              <p className="text-gray-600">¿Buscas una propiedad específica?</p>
              <Link href="/properties">
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Explorar Propiedades
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
