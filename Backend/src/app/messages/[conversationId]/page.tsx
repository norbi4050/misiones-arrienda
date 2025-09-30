'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import Thread from '@/components/ui/thread'
import { ArrowLeft, User } from 'lucide-react'

interface ConversationDetails {
  id: string
  property_id: string
  property_title: string
  property_image?: string
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
}

export default function ConversationPage({ 
  params 
}: { 
  params: { conversationId: string } 
}) {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && params.conversationId) {
      loadConversationDetails()
    }
  }, [user, params.conversationId])

  const loadConversationDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener detalles de la conversación desde la lista de hilos
      const response = await fetch('/api/messages/threads', {
        credentials: 'include'
      })
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (!response.ok) {
        throw new Error('Error al cargar conversación')
      }

      const data = await response.json()
      const foundConversation = data.threads?.find(
        (thread: any) => thread.id === params.conversationId
      )

      if (!foundConversation) {
        throw new Error('Conversación no encontrada')
      }

      setConversation({
        id: foundConversation.id,
        property_id: foundConversation.property_id,
        property_title: foundConversation.property_title,
        property_image: foundConversation.property_image,
        other_user_id: foundConversation.other_user_id || 'unknown',
        other_user_name: foundConversation.other_user_name,
        other_user_avatar: foundConversation.other_user_avatar
      })

    } catch (err: any) {
      console.error('Error loading conversation:', err)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando conversación...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/messages')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Volver a Mensajes
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">💬</div>
          <p className="text-gray-600">Conversación no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          {/* Botón volver */}
          <button
            onClick={() => router.push('/messages')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          {/* Información de la conversación */}
          <div className="flex items-center space-x-3 flex-1">
            {/* Imagen de la propiedad */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {conversation.property_image ? (
                <img
                  src={conversation.property_image}
                  alt={conversation.property_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {conversation.property_title}
              </h1>
              <p className="text-sm text-gray-600">
                Conversación con {conversation.other_user_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Thread Container */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-80px)]">
        <Thread
          conversationId={params.conversationId}
          propertyTitle={conversation.property_title}
          otherUserId={conversation.other_user_id}
          otherUserName={conversation.other_user_name}
          className="h-full"
        />
      </div>
    </div>
  )
}
