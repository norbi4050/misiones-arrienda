'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import Thread from '@/components/ui/thread'
import UnifiedThreadHeader from '@/components/messages/UnifiedThreadHeader'

interface ThreadInfo {
  threadId: string
  otherUser: {
    id: string
    displayName: string
    avatarUrl: string | null
    presence?: {
      isOnline: boolean
      lastSeen: string | null
      lastActivity: string
    }
  }
}

export default function ConversationPage({ 
  params 
}: { 
  params: { conversationId: string } 
}) {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const [threadInfo, setThreadInfo] = useState<ThreadInfo | null>(null)
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
      loadThreadInfo()
    }
  }, [user, params.conversationId])

  const loadThreadInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener información del thread desde el endpoint individual
      // Este endpoint ya tiene la lógica correcta de displayName
      const response = await fetch(`/api/messages/threads/${params.conversationId}`, {
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
      
      if (!data.success || !data.thread) {
        throw new Error('Conversación no encontrada')
      }

      setThreadInfo(data.thread)

    } catch (err: any) {
      console.error('Error loading thread info:', err)
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

  if (!threadInfo) {
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
      {/* Header Unificado con estado online/offline */}
      <UnifiedThreadHeader
        participant={{
          displayName: threadInfo.otherUser.displayName,
          avatarUrl: threadInfo.otherUser.avatarUrl,
          presence: threadInfo.otherUser.presence
        }}
        onBack={() => router.push('/messages')}
      />

      {/* Thread Container */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-80px)]">
        <Thread
          conversationId={params.conversationId}
          otherUserId={threadInfo.otherUser.id}
          otherUserName={threadInfo.otherUser.displayName}
          className="h-full"
        />
      </div>
    </div>
  )
}
