import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UnifiedConversation, UnifiedMessagesResponse } from '@/types/messages'

/**
 * ENDPOINT UNIFICADO DE MENSAJERÍA
 * 
 * GET /api/messages/unified?type=all|properties|community
 * 
 * Agrega conversaciones de:
 * - Sistema de Propiedades (/api/messages/threads)
 * - Sistema de Comunidad (/api/comunidad/messages)
 * 
 * Devuelve lista unificada ordenada por fecha con contadores por tipo
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get('type') || 'all' // all | properties | community

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('[UNIFIED] ❌ No autorizado')
      return NextResponse.json({ 
        error: 'UNAUTHORIZED' 
      }, { status: 401 })
    }

    console.log(`[UNIFIED] ✅ Usuario: ${user.id}, filter: ${filterType}`)

    // ============================================
    // 1. OBTENER CONVERSACIONES DE PROPIEDADES
    // ============================================
    let propertyConversations: UnifiedConversation[] = []
    
    try {
      const threadsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages/threads`,
        {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        }
      )

      if (threadsResponse.ok) {
        const threadsData = await threadsResponse.json()
        
        if (threadsData.success && threadsData.threads) {
          propertyConversations = threadsData.threads.map((thread: any) => ({
            id: thread.threadId,
            type: 'property' as const,
            otherUser: {
              id: thread.otherUser.id,
              displayName: thread.otherUser.displayName,
              avatarUrl: thread.otherUser.avatarUrl
            },
            lastMessage: thread.lastMessage ? {
              content: thread.lastMessage.content,
              createdAt: thread.lastMessage.createdAt,
              isMine: thread.lastMessage.isMine
            } : null,
            unreadCount: thread.unreadCount || 0,
            updatedAt: thread.updatedAt,
            property: thread.property || undefined
          }))
          
          console.log(`[UNIFIED] ✅ Propiedades: ${propertyConversations.length} threads`)
        }
      } else {
        console.warn('[UNIFIED] ⚠️ Error al obtener threads de propiedades:', threadsResponse.status)
      }
    } catch (error) {
      console.error('[UNIFIED] ❌ Error fetching property threads:', error)
    }

    // ============================================
    // 2. OBTENER CONVERSACIONES DE COMUNIDAD
    // ============================================
    let communityConversations: UnifiedConversation[] = []
    
    try {
      // Obtener conversaciones básicas
      const { data: communityData, error: communityError } = await supabase
        .from('community_conversations_view')
        .select('id,user1_id,user2_id,last_message_at,created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (!communityError && communityData) {
        // Enriquecer cada conversación
        for (const conv of communityData) {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id

          // Obtener datos del otro usuario
          const { data: otherUserProfile } = await supabase
            .from('user_profiles')
            .select('id, user_id, full_name, company_name, photos')
            .eq('user_id', otherUserId)
            .single()

          // Obtener último mensaje
          const { data: lastMsg } = await supabase
            .from('community_messages')
            .select('id, body, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Contar no leídos
          const { count: unreadCount } = await supabase
            .from('community_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .eq('is_read', false)

          // Calcular displayName
          const displayName = otherUserProfile?.company_name || 
                            otherUserProfile?.full_name || 
                            'Usuario'

          // Agregar a lista unificada
          communityConversations.push({
            id: conv.id,
            type: 'community',
            otherUser: {
              id: otherUserId,
              displayName,
              avatarUrl: otherUserProfile?.photos?.[0] || null
            },
            lastMessage: lastMsg ? {
              content: lastMsg.body,
              createdAt: new Date(lastMsg.created_at).toISOString(),
              isMine: lastMsg.sender_id === user.id
            } : null,
            unreadCount: unreadCount || 0,
            updatedAt: conv.last_message_at 
              ? new Date(conv.last_message_at).toISOString() 
              : new Date(conv.created_at).toISOString()
          })
        }
        
        console.log(`[UNIFIED] ✅ Comunidad: ${communityConversations.length} conversations`)
      } else {
        console.warn('[UNIFIED] ⚠️ Error al obtener conversaciones de comunidad:', communityError)
      }
    } catch (error) {
      console.error('[UNIFIED] ❌ Error fetching community conversations:', error)
    }

    // ============================================
    // 3. AGREGAR Y ORDENAR POR FECHA
    // ============================================
    let allConversations = [...propertyConversations, ...communityConversations]
    
    // Ordenar por updatedAt (más reciente primero)
    allConversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    // ============================================
    // 4. FILTRAR SEGÚN TIPO SOLICITADO
    // ============================================
    let filteredConversations = allConversations
    
    if (filterType === 'properties') {
      filteredConversations = allConversations.filter(c => c.type === 'property')
    } else if (filterType === 'community') {
      filteredConversations = allConversations.filter(c => c.type === 'community')
    }

    // ============================================
    // 5. CALCULAR CONTADORES
    // ============================================
    const counts = {
      all: allConversations.reduce((sum, c) => sum + c.unreadCount, 0),
      properties: propertyConversations.reduce((sum, c) => sum + c.unreadCount, 0),
      community: communityConversations.reduce((sum, c) => sum + c.unreadCount, 0)
    }

    const duration = Date.now() - startTime
    console.log(`[UNIFIED] ✅ Total: ${allConversations.length} (${propertyConversations.length} props + ${communityConversations.length} comm), filtered: ${filteredConversations.length}, ${duration}ms`)

    // ============================================
    // 6. RESPUESTA UNIFICADA
    // ============================================
    const response: UnifiedMessagesResponse = {
      success: true,
      conversations: filteredConversations,
      counts,
      _meta: {
        duration_ms: duration
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[UNIFIED] ❌ Error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR',
      details: error.message 
    }, { status: 500 })
  }
}
