'use client'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface MessageRealtimePayload {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  isRead: boolean
  sender?: {
    id: string
    full_name: string
    photos?: string[]
  }
}

export interface ConversationRealtimePayload {
  id: string
  lastMessage: string
  lastMessageTime: string
  updatedAt: string
  unreadCount: number
}

/**
 * Suscribirse a mensajes nuevos en una conversación específica
 */
export const subscribeToMessages = (
  conversationId: string,
  currentUserId: string,
  onNewMessage: (message: MessageRealtimePayload) => void
): RealtimeChannel => {
  const supabase = createBrowserSupabase()
  
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Message',
        filter: `conversationId=eq.${conversationId}`
      },
      (payload: any) => {
        console.log('🔴 New message received:', payload)
        const newMessage = payload.new as MessageRealtimePayload
        
        // Solo procesar si no es del usuario actual (evitar duplicados optimistas)
        if (newMessage.senderId !== currentUserId) {
          onNewMessage(newMessage)
        }
      }
    )
    .subscribe((status: any) => {
      console.log(`Messages subscription status: ${status}`)
    })

  return channel
}

/**
 * Suscribirse a actualizaciones de conversaciones (para inbox)
 */
export const subscribeToConversations = (
  userId: string,
  onConversationUpdate: (conversation: ConversationRealtimePayload) => void
): RealtimeChannel => {
  const supabase = createBrowserSupabase()
  
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'Conversation',
        filter: `id=eq.${userId}`
      },
      (payload: any) => {
        console.log('🔴 Conversation updated:', payload)
        onConversationUpdate(payload.new as ConversationRealtimePayload)
      }
    )
    .subscribe((status: any) => {
      console.log(`Conversations subscription status: ${status}`)
    })

  return channel
}

/**
 * Desuscribirse de un canal
 */
export const unsubscribeFromChannel = async (channel: RealtimeChannel): Promise<void> => {
  await channel.unsubscribe()
}

/**
 * Hook personalizado para manejar múltiples suscripciones de mensajes
 */
export class MessagesRealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()

  subscribeToMessages(
    conversationId: string,
    currentUserId: string,
    onNewMessage: (message: MessageRealtimePayload) => void
  ): void {
    const channelKey = `messages:${conversationId}`
    
    // Desuscribir canal anterior si existe
    if (this.channels.has(channelKey)) {
      this.unsubscribe(channelKey)
    }

    const channel = subscribeToMessages(conversationId, currentUserId, onNewMessage)
    this.channels.set(channelKey, channel)
  }

  subscribeToConversations(
    userId: string,
    onConversationUpdate: (conversation: ConversationRealtimePayload) => void
  ): void {
    const channelKey = `conversations:${userId}`
    
    if (this.channels.has(channelKey)) {
      this.unsubscribe(channelKey)
    }

    const channel = subscribeToConversations(userId, onConversationUpdate)
    this.channels.set(channelKey, channel)
  }

  unsubscribe(channelKey: string): void {
    const channel = this.channels.get(channelKey)
    if (channel) {
      unsubscribeFromChannel(channel)
      this.channels.delete(channelKey)
    }
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel, key) => {
      unsubscribeFromChannel(channel)
    })
    this.channels.clear()
  }
}

// Instancia global del manager
export const messagesRealtimeManager = new MessagesRealtimeManager()
