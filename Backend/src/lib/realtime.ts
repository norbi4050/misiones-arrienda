'use client'

import { createClient } from '@supabase/supabase-js'

// Cliente browser para realtime
function getBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Sistema realtime simplificado para mensajería
 */
export function subscribeToMessages(conversationId: string, onNewMessage: (message: any) => void) {
  const supabase = getBrowserClient()
  
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('🔴 Nuevo mensaje recibido via realtime:', payload)
        onNewMessage(payload.new)
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado suscripción mensajes: ${status}`)
    })

  return channel
}

/**
 * Suscribirse a cambios en conversaciones (para actualizar lista)
 */
export function subscribeToConversations(userId: string, onConversationUpdate: (conversation: any) => void) {
  const supabase = getBrowserClient()
  
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
      },
      (payload) => {
        console.log('🔴 Conversación actualizada via realtime:', payload)
        onConversationUpdate(payload.new)
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado suscripción conversaciones: ${status}`)
    })

  return channel
}

/**
 * Desuscribirse de canal
 */
export async function unsubscribeFromMessages(channel: any) {
  if (channel) {
    await channel.unsubscribe()
    console.log('📡 Desuscrito de canal de mensajes')
  }
}

/**
 * Desuscribirse de conversaciones
 */
export async function unsubscribeFromConversations(channel: any) {
  if (channel) {
    await channel.unsubscribe()
    console.log('📡 Desuscrito de canal de conversaciones')
  }
}
