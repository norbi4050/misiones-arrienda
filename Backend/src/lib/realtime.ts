'use client'

import { getBrowserSupabase } from '@/lib/supabase/browser'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Sistema realtime simplificado para mensajería
 * CORREGIDO: Usa tabla 'community_messages' que existe en el schema
 */
export function subscribeToMessages(conversationId: string, onNewMessage: (message: any) => void) {
  const supabase = getBrowserSupabase()
  
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages', // CORREGIDO: era 'messages', ahora 'community_messages'
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        console.log('🔴 Nuevo mensaje recibido via realtime:', payload)
        onNewMessage(payload.new)
      }
    )
    .subscribe((status: string) => {
      console.log(`📡 Estado suscripción mensajes: ${status}`)
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en suscripción realtime. Verifica políticas RLS en community_messages')
      }
    })

  return channel
}

/**
 * Suscribirse a cambios en conversaciones (para actualizar lista)
 * CORREGIDO: Usa tabla 'community_conversations' y columnas correctas
 */
export function subscribeToConversations(userId: string, onConversationUpdate: (conversation: any) => void) {
  const supabase = getBrowserSupabase()
  
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_conversations', // CORREGIDO: era 'conversations', ahora 'community_conversations'
        filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})` // CORREGIDO: columnas correctas
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        console.log('🔴 Conversación actualizada via realtime:', payload)
        onConversationUpdate(payload.new)
      }
    )
    .subscribe((status: string) => {
      console.log(`📡 Estado suscripción conversaciones: ${status}`)
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en suscripción realtime. Verifica políticas RLS en community_conversations')
      }
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
