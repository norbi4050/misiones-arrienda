// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/messages/unread-count - Obtener conteo total de mensajes no leídos
 * Combina mensajes de propiedades y mensajes de comunidad
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('[UNREAD-COUNT] No session, returning 0')
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    let totalUnreadCount = 0

    // ============================================
    // 1. OBTENER MENSAJES NO LEÍDOS DE PROPIEDADES
    // ============================================
    try {
      console.log('[UNREAD-COUNT] Getting property unread messages')

      // Detectar esquema de base de datos
      const { schema, reason: schemaReason } = await detectSchema(supabase, user.id)

      if (schema) {
        if (schema === 'PRISMA') {
          // Obtener UserProfile del usuario actual
          const { data: userProfile, error: profileError } = await supabase
            .from('UserProfile')
            .select('id')
            .eq('userId', user.id)
            .single()

          if (!profileError && userProfile) {
            const profileId = userProfile.id

            // Obtener conversaciones donde el usuario es participante
            const { data: conversations, error: convError } = await supabase
              .from('Conversation')
              .select('id, aId, bId')
              .or(`aId.eq.${profileId},bId.eq.${profileId}`)
              .eq('isActive', true)

            if (!convError && conversations) {
              // Para cada conversación, contar mensajes no leídos
              for (const conv of conversations) {
                const { count: unreadCount } = await supabase
                  .from('Message')
                  .select('*', { count: 'exact', head: true })
                  .eq('conversationId', conv.id)
                  .neq('senderId', profileId)
                  .eq('isRead', false)

                totalUnreadCount += unreadCount || 0
              }
            }
          }
        } else if (schema === 'SUPABASE') {
          // Para Supabase, contar directamente de messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', user.id) // Asumiendo que conversation_id es el user ID
            .neq('sender_id', user.id)
            .eq('is_read', false)

          totalUnreadCount += unreadCount || 0
        }
      }

      console.log(`[UNREAD-COUNT] Property unread messages: ${totalUnreadCount}`)
    } catch (error) {
      console.log('[UNREAD-COUNT] Error getting property unread messages:', error)
    }

    // ============================================
    // 2. OBTENER MENSAJES NO LEÍDOS DE COMUNIDAD
    // ============================================
    try {
      console.log('[UNREAD-COUNT] Getting community unread messages')

      // Usar la lógica del endpoint existente de comunidad
      let communityUnreadCount = 0

      // Estrategia 1: RPC (si existe y está habilitado)
      const enableUnreadRpc = process.env.NEXT_PUBLIC_ENABLE_UNREAD_RPC === '1'
      
      if (enableUnreadRpc) {
        try {
          const { data, error } = await supabase.rpc('get_unread_messages_count', {
            p_uid: user.id
          })

          if (typeof data === 'number') {
            communityUnreadCount = data
          }
        } catch (rpcError) {
          console.log('[UNREAD-COUNT] RPC not available, trying fallback strategies')
        }
      }
      
      // Si RPC está deshabilitado o falló, NO usar estrategias legacy
      // (evita 404s por tablas que no existen: public.messages, etc.)
      if (communityUnreadCount === 0 && !enableUnreadRpc) {
        console.log('[UNREAD-COUNT] RPC deshabilitado, skipping legacy fallbacks (evita 404s)')
      }

      totalUnreadCount += communityUnreadCount
      console.log(`[UNREAD-COUNT] Community unread messages: ${communityUnreadCount}`)
    } catch (error) {
      console.log('[UNREAD-COUNT] Error getting community unread messages:', error)
    }

    console.log(`[UNREAD-COUNT] Total unread messages: ${totalUnreadCount}`)
    return NextResponse.json({ count: totalUnreadCount }, { status: 200 })

  } catch (error) {
    console.error('[UNREAD-COUNT] Unexpected error:', error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}

// Función auxiliar para detectar esquema (copiada del threads route)
async function detectSchema(supabase: any, userId: string): Promise<{
  schema: 'PRISMA' | 'SUPABASE' | null,
  reason: string
}> {
  // Verificar si el usuario tiene UserProfile
  let hasUserProfile = false
  try {
    const { data: userProfile, error } = await supabase
      .from('UserProfile')
      .select('id')
      .eq('userId', userId)
      .single()

    hasUserProfile = !error && !!userProfile
  } catch {}

  // Verificar si existe tabla Conversation (Prisma - singular, PascalCase)
  let hasConversationTable = false
  let conversationHasPrismaColumns = false
  try {
    const { data, error } = await supabase
      .from('Conversation')
      .select('*')
      .limit(1)
      .maybeSingle()

    hasConversationTable = !error
    if (data) {
      conversationHasPrismaColumns = 'aId' in data || 'bId' in data
    }
  } catch {}

  // Verificar si existe tabla conversations (plural, snake_case)
  let hasConversationsTable = false
  let conversationsHasSupabaseColumns = false
  let conversationsHasPrismaColumns = false
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(1)
      .maybeSingle()

    hasConversationsTable = !error
    if (data) {
      conversationsHasSupabaseColumns = 'sender_id' in data || 'receiver_id' in data
      conversationsHasPrismaColumns = 'a_id' in data || 'b_id' in data
    }
  } catch {}

  // Decidir rama según usuario, tablas Y columnas
  if (hasUserProfile && hasConversationTable && conversationHasPrismaColumns) {
    return { schema: 'PRISMA', reason: 'FOUND_PROFILE_AND_PRISMA_TABLE' }
  }

  if (hasConversationTable && conversationHasPrismaColumns) {
    return { schema: 'PRISMA', reason: 'FOUND_PRISMA_TABLE' }
  }

  if (hasConversationsTable && conversationsHasSupabaseColumns) {
    return { schema: 'SUPABASE', reason: 'FOUND_SUPABASE_COLUMNS' }
  }

  if (hasConversationsTable && conversationsHasPrismaColumns) {
    return { schema: 'PRISMA', reason: 'FOUND_PRISMA_COLUMNS_IN_LOWERCASE_TABLE' }
  }

  if (hasConversationTable) {
    return { schema: 'PRISMA', reason: 'FOUND_CONVERSATION_TABLE_FALLBACK' }
  }

  if (hasConversationsTable) {
    return { schema: 'PRISMA', reason: 'FOUND_CONVERSATIONS_TABLE_FALLBACK' }
  }

  return { schema: null, reason: 'NO_TABLES_FOUND' }
}
