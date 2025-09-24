'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { 
  Conversation, 
  Message, 
  MessagesContextType, 
  ConversationStats 
} from '@/types/messages'

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabaseAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/messages')
      if (!response.ok) {
        throw new Error('Error al cargar conversaciones')
      }
      
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err: any) {
      console.error('Error fetching conversations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (conversationId: string, content: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        throw new Error('Error al enviar mensaje')
      }

      // Refrescar conversaciones
      await fetchConversations()
      return true
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message)
      return false
    }
  }

  const createConversation = async (
    propertyId: string, 
    recipientId: string, 
    initialMessage: string
  ): Promise<string | null> => {
    if (!user) return null

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          recipientId,
          message: initialMessage
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear conversación')
      }

      const data = await response.json()
      
      // Refrescar conversaciones
      await fetchConversations()
      
      return data.conversationId
    } catch (err: any) {
      console.error('Error creating conversation:', err)
      setError(err.message)
      return null
    }
  }

  const markAsRead = async (conversationId: string): Promise<void> => {
    if (!user) return

    try {
      const response = await fetch(`/api/messages/${conversationId}/read`, {
        method: 'POST'
      })

      if (response.ok) {
        // Actualizar estado local
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, unread_count: 0 }
              : conv
          )
        )
      }
    } catch (err: any) {
      console.error('Error marking as read:', err)
    }
  }

  const archiveConversation = async (conversationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/messages/${conversationId}/archive`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchConversations()
        return true
      }
      return false
    } catch (err: any) {
      console.error('Error archiving conversation:', err)
      setError(err.message)
      return false
    }
  }

  const blockConversation = async (conversationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/messages/${conversationId}/block`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchConversations()
        return true
      }
      return false
    } catch (err: any) {
      console.error('Error blocking conversation:', err)
      setError(err.message)
      return false
    }
  }

  const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
    if (!user) return []

    try {
      const response = await fetch(`/api/messages/${conversationId}`)
      if (!response.ok) {
        throw new Error('Error al cargar mensajes')
      }
      
      const data = await response.json()
      return data.messages || []
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError(err.message)
      return []
    }
  }

  const refreshConversations = async () => {
    await fetchConversations()
  }

  // Calcular total de mensajes no leídos
  const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0)

  // Calcular estadísticas
  const stats: ConversationStats = {
    total: conversations.length,
    unread: conversations.filter(conv => conv.unread_count > 0).length,
    active: conversations.filter(conv => conv.status === 'ACTIVE').length,
    archived: conversations.filter(conv => conv.status === 'ARCHIVED').length
  }

  useEffect(() => {
    fetchConversations()
  }, [user])

  const value: MessagesContextType = {
    conversations,
    activeConversation,
    loading,
    error,
    unreadCount,
    stats,
    setActiveConversation,
    sendMessage,
    createConversation,
    markAsRead,
    archiveConversation,
    blockConversation,
    refreshConversations,
    getConversationMessages
  }

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider')
  }
  return context
}
