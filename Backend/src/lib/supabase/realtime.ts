'use client'

import { createClient } from '@/lib/supabase/server'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface MessageRealtimePayload {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image'
  created_at: string
  sender?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface ConversationRealtimePayload {
  id: string
  last_message_content: string
  last_message_at: string
  updated_at: string
  unread_count_user1: number
  unread_count_user2: number
}

/**
 * Suscribirse a mensajes nuevos en una conversación específica
 */
export const subscribeToMessages = (
  conversationId: string,
  onNewMessage: (message: MessageRealtimePayload) => void
): RealtimeChannel => {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('New message received:', payload)
        onNewMessage(payload.new as MessageRealtimePayload)
      }
    )
    .subscribe((status) => {
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
  const supabase = createClient()
  
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'community_conversations',
        filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
      },
      (payload) => {
        console.log('Conversation updated:', payload)
        onConversationUpdate(payload.new as ConversationRealtimePayload)
      }
    )
    .subscribe((status) => {
      console.log(`Conversations subscription status: ${status}`)
    })

  return channel
}

/**
 * Suscribirse a cambios de estado online/offline de usuarios
 */
export const subscribeToUserPresence = (
  conversationId: string,
  userId: string,
  onPresenceChange: (presences: Record<string, any>) => void
): RealtimeChannel => {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`presence:${conversationId}`)
    .on('presence', { event: 'sync' }, () => {
      const newState = channel.presenceState()
      onPresenceChange(newState)
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences)
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Marcar usuario como online
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString()
        })
      }
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
 * Hook personalizado para manejar múltiples suscripciones
 */
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()

  subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: MessageRealtimePayload) => void
  ): void {
    const channelKey = `messages:${conversationId}`
    
    // Desuscribir canal anterior si existe
    if (this.channels.has(channelKey)) {
      this.unsubscribe(channelKey)
    }

    const channel = subscribeToMessages(conversationId, onNewMessage)
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

  subscribeToPresence(
    conversationId: string,
    userId: string,
    onPresenceChange: (presences: Record<string, any>) => void
  ): void {
    const channelKey = `presence:${conversationId}`
    
    if (this.channels.has(channelKey)) {
      this.unsubscribe(channelKey)
    }

    const channel = subscribeToUserPresence(conversationId, userId, onPresenceChange)
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
export const realtimeManager = new RealtimeManager()
