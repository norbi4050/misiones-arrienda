'use client'

import { createClient } from '@/lib/supabase/server'

/**
 * Sistema realtime simplificado para mensajería
 */
export function subscribeToMessages(conversationId: string, onNewMessage: (message: any) => void) {
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
 * Desuscribirse de canal
 */
export async function unsubscribeFromMessages(channel: any) {
  if (channel) {
    await channel.unsubscribe()
    console.log('📡 Desuscrito de canal de mensajes')
  }
}
