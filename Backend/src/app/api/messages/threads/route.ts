import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PROMPT 2: Detección automática de esquema y fallback
 * 
 * Rama A (Prisma-like): aId/bId o a_id/b_id, createdAt, lastMessageAt
 * Rama B (Supabase-like): sender_id/receiver_id, created_at, last_message_at
 */

// PROMPT C: Detectar esquema con prioridad por usuario
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

  // PROMPT C: Decidir rama según usuario, tablas Y columnas
  
  // Prioridad 1: Si hay UserProfile y tabla Conversation con columnas Prisma
  if (hasUserProfile && hasConversationTable && conversationHasPrismaColumns) {
    console.log('[SCHEMA] decided=PRISMA reason=FOUND_PROFILE_AND_PRISMA_TABLE')
    return { schema: 'PRISMA', reason: 'FOUND_PROFILE_AND_PRISMA_TABLE' }
  }

  // Prioridad 2: Si tabla Conversation existe con columnas Prisma
  if (hasConversationTable && conversationHasPrismaColumns) {
    console.log('[SCHEMA] decided=PRISMA reason=FOUND_PRISMA_TABLE')
    return { schema: 'PRISMA', reason: 'FOUND_PRISMA_TABLE' }
  }

  // Prioridad 3: Si tabla conversations tiene columnas Supabase
  if (hasConversationsTable && conversationsHasSupabaseColumns) {
    console.log('[SCHEMA] decided=SUPABASE reason=FOUND_SUPABASE_COLUMNS')
    return { schema: 'SUPABASE', reason: 'FOUND_SUPABASE_COLUMNS' }
  }

  // Prioridad 4: Si tabla conversations tiene columnas Prisma snake_case (a_id/b_id)
  if (hasConversationsTable && conversationsHasPrismaColumns) {
    console.log('[SCHEMA] decided=PRISMA reason=FOUND_PRISMA_COLUMNS_IN_LOWERCASE_TABLE')
    return { schema: 'PRISMA', reason: 'FOUND_PRISMA_COLUMNS_IN_LOWERCASE_TABLE' }
  }

  // Fallback: Si solo existe tabla Conversation
  if (hasConversationTable) {
    console.log('[SCHEMA] decided=PRISMA reason=FOUND_CONVERSATION_TABLE_FALLBACK')
    return { schema: 'PRISMA', reason: 'FOUND_CONVERSATION_TABLE_FALLBACK' }
  }

  // Fallback: Si solo existe tabla conversations
  if (hasConversationsTable) {
    console.log('[SCHEMA] decided=PRISMA reason=FOUND_CONVERSATIONS_TABLE_FALLBACK')
    return { schema: 'PRISMA', reason: 'FOUND_CONVERSATIONS_TABLE_FALLBACK' }
  }

  console.error('[SCHEMA DETECTION] ❌ No se pudo detectar esquema válido')
  return { schema: null, reason: 'NO_TABLES_FOUND' }
}

// GET /api/messages/threads → lista hilos del usuario autenticado
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()

    // PROMPT 3: Auth consistente
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('[AUTH] ❌ No autorizado')
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    console.log(`[AUTH] ✅ Usuario: ${user.id}`)

    // PROMPT C: Detectar esquema con prioridad por usuario
    const { schema, reason: schemaReason } = await detectSchema(supabase, user.id)
    
    if (!schema) {
      console.error('[SCHEMA] ❌ No se pudo detectar esquema de DB')
      return NextResponse.json({ 
        error: 'DB_ERROR',
        details: 'No se encontró tabla de conversaciones válida'
      }, { status: 500 })
    }

    console.log(`[SCHEMA] ✅ Usando rama: ${schema}, reason: ${schemaReason}`)

    let threads: any[] = []

    // ============================================
    // RAMA A: PRISMA (Conversation/conversations con aId/bId o a_id/b_id)
    // ============================================
    if (schema === 'PRISMA') {
      // Determinar qué tabla usar basándose en el reason
      const useConversationTable = schemaReason.includes('CONVERSATION_TABLE') || schemaReason.includes('PRISMA_TABLE')
      const tableName = useConversationTable ? 'Conversation' : 'conversations'
      const useSnakeCase = tableName === 'conversations'
      
      console.log(`[PRISMA BRANCH] Using table: ${tableName}, snake_case: ${useSnakeCase}`)

      // Obtener UserProfile del usuario actual
      const { data: userProfile, error: profileError } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', user.id)
        .single()

      if (profileError || !userProfile) {
        console.log('[PROFILE] ⚠️ No se encontró UserProfile para usuario:', user.id)
        console.log('[SCHEMA] 🔄 Usuario sin perfil, devolviendo lista vacía')
        
        // PROMPT B: Devolver 200 con threads vacíos en lugar de 403
        const duration = Date.now() - startTime
        return NextResponse.json({
          success: true,
          threads: [],
          _meta: {
            schema: 'PRISMA',
            schema_reason: schemaReason === 'FOUND_PROFILE' ? 'NO_PROFILE' : schemaReason,
            count: 0,
            duration_ms: duration,
            message: 'Usuario no tiene perfil de comunidad'
          }
        })
      }

      const profileId = userProfile.id
      console.log(`[PROFILE] ✅ UserProfile: ${profileId}`)

      // Construir query según el naming de la tabla
      const aIdField = useSnakeCase ? 'a_id' : 'aId'
      const bIdField = useSnakeCase ? 'b_id' : 'bId'
      const isActiveField = useSnakeCase ? 'is_active' : 'isActive'
      const lastMessageAtField = useSnakeCase ? 'last_message_at' : 'lastMessageAt'
      const createdAtField = useSnakeCase ? 'created_at' : 'createdAt'
      const updatedAtField = useSnakeCase ? 'updated_at' : 'updatedAt'

      // Obtener conversaciones donde el usuario es participante
      const { data: conversations, error: convError } = await supabase
        .from(tableName)
        .select(`
          id,
          ${aIdField},
          ${bIdField},
          ${isActiveField},
          ${lastMessageAtField},
          ${createdAtField},
          ${updatedAtField}
        `)
        .or(`${aIdField}.eq.${profileId},${bIdField}.eq.${profileId}`)
        .eq(isActiveField, true)
        .order(updatedAtField, { ascending: false })

      if (convError) {
        console.error('[DB] ❌ Error al obtener conversaciones:', convError)
        return NextResponse.json({ 
          error: 'DB_ERROR',
          details: convError.message 
        }, { status: 500 })
      }

      // Formatear cada conversación
      for (const conv of conversations || []) {
        const otherUserId = (conv as any)[aIdField] === profileId ? (conv as any)[bIdField] : (conv as any)[aIdField]

        // Obtener datos del otro usuario
        const { data: otherProfile } = await supabase
          .from('UserProfile')
          .select('id, userId')
          .eq('id', otherUserId)
          .single()

        // Obtener datos del User relacionado
        let otherUserData: any = null
        if (otherProfile?.userId) {
          const { data: userData } = await supabase
            .from('User')
            .select('name, email, avatar')
            .eq('id', otherProfile.userId)
            .single()
          otherUserData = userData
        }

        // Obtener último mensaje
        const { data: lastMsg } = await supabase
          .from('Message')
          .select('id, body, createdAt, senderId')
          .eq('conversationId', conv.id)
          .order('createdAt', { ascending: false })
          .limit(1)
          .single()

        // Contar mensajes no leídos
        const { count: unreadCount } = await supabase
          .from('Message')
          .select('*', { count: 'exact', head: true })
          .eq('conversationId', conv.id)
          .neq('senderId', profileId)
          .eq('isRead', false)

        threads.push({
          threadId: conv.id,
          otherUser: {
            id: otherProfile?.userId || otherUserId,
            name: otherUserData?.name || 'Usuario',
            avatar: otherUserData?.avatar || null
          },
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.body,
            createdAt: lastMsg.createdAt,
            isMine: lastMsg.senderId === profileId
          } : null,
          unreadCount: unreadCount || 0,
          updatedAt: useSnakeCase ? (conv as any).updated_at : (conv as any).updatedAt
        })
      }
    }

    // ============================================
    // RAMA B: SUPABASE (conversations con sender_id/receiver_id)
    // ============================================
    else if (schema === 'SUPABASE') {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          sender_id,
          receiver_id,
          property_id,
          created_at,
          updated_at,
          last_message_at
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (convError) {
        console.error('[DB] ❌ Error al obtener conversaciones:', convError)
        return NextResponse.json({ 
          error: 'DB_ERROR',
          details: convError.message 
        }, { status: 500 })
      }

      // Formatear cada conversación
      for (const conv of conversations || []) {
        const otherUserId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id

        // Obtener datos del otro usuario desde user_profiles
        const { data: otherUser } = await supabase
          .from('user_profiles')
          .select('id, user_id, full_name, photos')
          .eq('user_id', otherUserId)
          .single()

        // Obtener último mensaje
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('id, body, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Contar mensajes no leídos
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .eq('is_read', false)

        threads.push({
          threadId: conv.id,
          otherUser: {
            id: otherUserId,
            name: otherUser?.full_name || 'Usuario',
            avatar: otherUser?.photos?.[0] || null
          },
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.body,
            createdAt: lastMsg.created_at,
            isMine: lastMsg.sender_id === user.id
          } : null,
          unreadCount: unreadCount || 0,
          updatedAt: conv.updated_at
        })
      }
    }

    const duration = Date.now() - startTime
    console.log(`[THREADS GET] ✅ ${threads.length} hilos en ${duration}ms usando rama ${schema}`)

    // PROMPT 2 & C: Formato unificado para el cliente
    return NextResponse.json({
      success: true,
      threads,
      _meta: {
        schema,
        schema_reason: schemaReason,
        count: threads.length,
        duration_ms: duration
      }
    })

  } catch (error: any) {
    console.error('[THREADS GET] ❌ Error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR',
      details: error.message 
    }, { status: 500 })
  }
}

// POST /api/messages/threads → crear/abrir hilo
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()

    // PROMPT 3: Auth consistente
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('[AUTH] ❌ No autorizado')
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, toUserId } = body

    console.log(`[THREADS POST] Usuario: ${user.id}, toUserId: ${toUserId}, propertyId: ${propertyId}`)

    if (!toUserId) {
      return NextResponse.json({ 
        error: 'VALIDATION_ERROR',
        issues: [{ path: 'toUserId', message: 'toUserId is required' }]
      }, { status: 400 })
    }

    // PROMPT C: Detectar esquema con prioridad por usuario
    const { schema, reason: schemaReason } = await detectSchema(supabase, user.id)
    
    if (!schema) {
      console.error('[SCHEMA] ❌ No se pudo detectar esquema de DB')
      return NextResponse.json({ 
        error: 'DB_ERROR',
        details: 'No se encontró tabla de conversaciones válida'
      }, { status: 500 })
    }

    console.log(`[SCHEMA] ✅ Usando rama: ${schema}, reason: ${schemaReason}`)

    let threadId: string | null = null
    let existing = false

    // ============================================
    // RAMA A: PRISMA (Conversation con aId/bId)
    // ============================================
    if (schema === 'PRISMA') {
      // Obtener UserProfile del usuario actual
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', user.id)
        .single()

      if (currentProfileError || !currentProfile) {
        console.error('[PROFILE] ❌ No se encontró UserProfile para usuario:', user.id)
        return NextResponse.json({ 
          error: 'PROFILE_NOT_FOUND',
          details: 'Necesitas completar tu perfil de comunidad primero'
        }, { status: 403 })
      }

      // Obtener UserProfile del usuario destino
      const { data: targetProfile, error: targetProfileError } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', toUserId)
        .single()

      if (targetProfileError || !targetProfile) {
        console.error('[PROFILE] ❌ No se encontró UserProfile para toUserId:', toUserId)
        return NextResponse.json({ 
          error: 'TARGET_USER_NOT_FOUND',
          details: 'El usuario destino no tiene perfil de comunidad'
        }, { status: 404 })
      }

      const currentProfileId = currentProfile.id
      const targetProfileId = targetProfile.id

      console.log(`[PROFILE] ✅ Current: ${currentProfileId}, Target: ${targetProfileId}`)

      // Buscar conversación existente (idempotente) - siempre usar tabla Conversation para POST
      const { data: existingConv } = await supabase
        .from('Conversation')
        .select('id')
        .or(`and(aId.eq.${currentProfileId},bId.eq.${targetProfileId}),and(aId.eq.${targetProfileId},bId.eq.${currentProfileId})`)
        .eq('isActive', true)
        .single()

      if (existingConv) {
        threadId = existingConv.id
        existing = true
        console.log(`[CONVERSATION] ✅ Existente: ${threadId}`)
      } else {
        // Crear nueva conversación
        const { data: newConv, error: createError } = await supabase
          .from('Conversation')
          .insert({
            aId: currentProfileId,
            bId: targetProfileId,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select('id')
          .single()

        if (createError) {
          console.error('[DB] ❌ Error al crear conversación:', createError)
          return NextResponse.json({ 
            error: 'DB_ERROR',
            details: createError.message 
          }, { status: 500 })
        }

        threadId = newConv.id
        existing = false
        console.log(`[CONVERSATION] ✅ Nueva: ${threadId}`)
      }
    }

    // ============================================
    // RAMA B: SUPABASE (conversations con sender_id/receiver_id)
    // ============================================
    else if (schema === 'SUPABASE') {
      // Verificar que la propiedad existe (si se proporciona)
      if (propertyId) {
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('id, user_id')
          .eq('id', propertyId)
          .single()

        if (propertyError || !property) {
          console.error('[PROPERTY] ❌ Propiedad no encontrada:', propertyId)
          return NextResponse.json({ 
            error: 'PROPERTY_NOT_FOUND' 
          }, { status: 404 })
        }
      }

      // Verificar que el usuario destino existe
      const { data: targetUser, error: userError } = await supabase
        .from('user_profiles')
        .select('id, user_id')
        .eq('user_id', toUserId)
        .single()

      if (userError || !targetUser) {
        console.error('[USER] ❌ Usuario destino no encontrado:', toUserId)
        return NextResponse.json({ 
          error: 'TARGET_USER_NOT_FOUND' 
        }, { status: 404 })
      }

      // Buscar conversación existente (idempotente)
      let query = supabase
        .from('conversations')
        .select('id')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${toUserId}),and(sender_id.eq.${toUserId},receiver_id.eq.${user.id})`)

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data: existingConv } = await query.single()

      if (existingConv) {
        threadId = existingConv.id
        existing = true
        console.log(`[CONVERSATION] ✅ Existente: ${threadId}`)
      } else {
        // Crear nueva conversación
        const insertData: any = {
          sender_id: user.id,
          receiver_id: toUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        if (propertyId) {
          insertData.property_id = propertyId
        }

        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert(insertData)
          .select('id')
          .single()

        if (createError) {
          console.error('[DB] ❌ Error al crear conversación:', createError)
          return NextResponse.json({ 
            error: 'DB_ERROR',
            details: createError.message 
          }, { status: 500 })
        }

        threadId = newConv.id
        existing = false
        console.log(`[CONVERSATION] ✅ Nueva: ${threadId}`)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[THREADS POST] ✅ threadId: ${threadId}, existing: ${existing}, ${duration}ms, rama: ${schema}`)

    // PROMPT 1, 2 & C: Respuesta unificada con threadId
    return NextResponse.json({
      success: true,
      threadId,
      existing,
      _meta: {
        schema,
        schema_reason: schemaReason,
        duration_ms: duration
      }
    })

  } catch (error: any) {
    console.error('[THREADS POST] ❌ Error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR',
      details: error.message 
    }, { status: 500 })
  }
}
