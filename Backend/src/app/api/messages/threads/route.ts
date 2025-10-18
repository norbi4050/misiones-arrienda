// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDisplayName, getDisplayNameWithSource, isUUID } from '@/lib/messages/display-name-helper'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

      // Obtener UserProfile del usuario actual usando Prisma (bypassa RLS)
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id }
      })

      if (!userProfile) {
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
      console.log(`[PROFILE] ✅ UserProfile con Prisma: ${profileId}`)

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
        const otherProfileId = (conv as any)[aIdField] === profileId ? (conv as any)[bIdField] : (conv as any)[aIdField]

        // PROMPT 1: Obtener datos completos del otro usuario usando Prisma (bypassa RLS)
        const otherProfile = await prisma.userProfile.findUnique({
          where: { id: otherProfileId },
          select: { id: true, userId: true }
        })

        // Obtener datos del User relacionado usando Prisma
        let otherUserData: any = null
        if (otherProfile?.userId) {
          otherUserData = await prisma.user.findUnique({
            where: { id: otherProfile.userId },
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              companyName: true
            }
          })
          console.log(`[User Data] ✅ Usuario encontrado con Prisma:`, otherUserData)
        }

        // PROMPT D1 & D2: Calcular displayName con source tracking
        const { displayName, source } = getDisplayNameWithSource(
          otherUserData,  // Incluye name, email, avatar, companyName
          null  // UserProfile no tiene full_name, usar solo User data
        )

        // PROMPT D1: Log detallado de displayName resolution
        console.log(`[DISPLAYNAME] conversationId=${conv.id}, me.id=${user.id}, otherUser.id=${otherUserData?.id || otherProfile?.userId}, otherUser.displayName="${displayName}", sourceUsed=${source}`)
        
        // PROMPT D1: Warning si displayName está vacío o es UUID
        if (!displayName || displayName.trim() === '' || isUUID(displayName)) {
          console.warn(`[DisplayName] MISSING → payload would fallback to conversationId for conversation=${conv.id}`)
        }

        // PROMPT D6: Check preventivo antes de responder
        let finalDisplayName = displayName
        if (!finalDisplayName || finalDisplayName.trim() === '' || isUUID(finalDisplayName)) {
          console.warn(`[DisplayName] FALLBACK APPLIED for userId=${otherUserData?.id || otherProfile?.userId}`)
          finalDisplayName = 'Usuario'
        }

        // PROMPT D6: Log de DATA GAP si faltan datos en DB (actualizado sin full_name)
        if (!otherUserData?.name && !otherUserData?.companyName) {
          console.warn(`[DisplayName] DATA GAP userId=${otherUserData?.id || otherProfile?.userId} - no name/companyName in DB`)
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

        // PROMPT 1: Obtener info de propiedad si existe (best-effort)
        let propertyInfo = null
        const propertyIdField = useSnakeCase ? 'property_id' : 'propertyId'
        const convPropertyId = (conv as any)[propertyIdField]
        
        if (convPropertyId) {
          try {
            const { data: property } = await supabase
              .from('Property')
              .select('id, title, images')
              .eq('id', convPropertyId)
              .single()
            
            if (property) {
              const coverUrl = property.images?.[0] || null
              propertyInfo = {
                id: property.id,
                title: property.title,
                coverUrl
              }
            }
          } catch (propErr) {
            console.log('[PROPERTY] ⚠️ No se pudo obtener info de propiedad:', convPropertyId)
          }
        }

        // PROMPT 1: Asegurar fechas ISO 8601 estrictas
        const updatedAtRaw = useSnakeCase ? (conv as any).updated_at : (conv as any).updatedAt
        const updatedAtISO = updatedAtRaw ? new Date(updatedAtRaw).toISOString() : new Date().toISOString()
        
        const lastMessageCreatedAtRaw = lastMsg?.createdAt
        const lastMessageCreatedAtISO = lastMessageCreatedAtRaw ? new Date(lastMessageCreatedAtRaw).toISOString() : null

        // Avatar viene directamente de User (ya obtenido con Prisma)
        const finalAvatarUrl = otherUserData?.avatar || null
        console.log(`[AVATAR DEBUG] Final avatarUrl desde User (Prisma): ${finalAvatarUrl}`)
        
        threads.push({
          conversationId: conv.id,
          otherUser: {
            id: otherUserData?.id || otherProfile?.userId,
            displayName: finalDisplayName,  // PROMPT D2: garantizado no vacío, no UUID
            avatarUrl: finalAvatarUrl,
            __displayNameSource: source     // PROMPT D1: campo debug para ver fuente
          },
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.body,
            createdAt: lastMessageCreatedAtISO,  // PROMPT 1: ISO 8601 estricta
            senderId: lastMsg.senderId,     // PROMPT 1: explícito
            isMine: lastMsg.senderId === profileId
          } : null,
          unreadCount: unreadCount || 0,
          updatedAt: updatedAtISO,          // PROMPT 1: ISO 8601 estricta
          property: propertyInfo              // PROMPT 1: info de propiedad
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

        // PROMPT 1: Obtener datos completos del otro usuario desde user_profiles
        // NOTA: En user_profiles, el campo 'id' ES el user_id (no hay columna user_id separada)
        const { data: otherProfile } = await supabase
          .from('user_profiles')
          .select('id, display_name, avatar_url')
          .eq('id', otherUserId)
          .single()

        // Obtener datos del User relacionado (CORRECCIÓN: companyName está en User)
        let otherUserData: any = null
        try {
          const { data: userData } = await supabase
            .from('User')
            .select('id, name, email, avatar, companyName')  // ✅ AGREGADO companyName
            .eq('id', otherUserId)
            .single()
          otherUserData = userData
        } catch {
          // Si no existe tabla User, usar solo user_profiles
        }

        // PROMPT D1 & D2: Calcular displayName
        // Para Supabase, user_profiles.display_name ya es el nombre correcto
        const displayName = otherProfile?.display_name || 
                           otherUserData?.name || 
                           otherUserData?.companyName ||
                           (otherUserData?.email ? otherUserData.email.split('@')[0] : null) ||
                           'Usuario'
        const source = otherProfile?.display_name ? 'user_profiles.display_name' : 
                      otherUserData?.name ? 'User.name' :
                      otherUserData?.companyName ? 'User.companyName' :
                      'fallback'

        // PROMPT D1: Log detallado de displayName resolution
        console.log(`[DISPLAYNAME] conversationId=${conv.id}, me.id=${user.id}, otherUser.id=${otherUserId}, otherUser.displayName="${displayName}", sourceUsed=${source}`)
        
        // PROMPT D1: Warning si displayName está vacío o es UUID
        if (!displayName || displayName.trim() === '' || isUUID(displayName)) {
          console.warn(`[DisplayName] MISSING → payload would fallback to conversationId for conversation=${conv.id}`)
        }

        // PROMPT D6: Check preventivo antes de responder
        let finalDisplayName = displayName
        if (!finalDisplayName || finalDisplayName.trim() === '' || isUUID(finalDisplayName)) {
          console.warn(`[DisplayName] FALLBACK APPLIED for userId=${otherUserId}`)
          finalDisplayName = 'Usuario'
        }

        // PROMPT D6: Log de DATA GAP si faltan datos en DB (actualizado)
        if (!otherUserData?.name && !otherProfile?.display_name) {
          console.warn(`[DisplayName] DATA GAP userId=${otherUserId} - no name/display_name in DB`)
        }

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

        // PROMPT 1: Obtener info de propiedad si existe (best-effort)
        let propertyInfo = null
        if (conv.property_id) {
          try {
            const { data: property } = await supabase
              .from('properties')
              .select('id, title, images')
              .eq('id', conv.property_id)
              .single()
            
            if (property) {
              const coverUrl = property.images?.[0] || null
              propertyInfo = {
                id: property.id,
                title: property.title,
                coverUrl
              }
            }
          } catch (propErr) {
            console.log('[PROPERTY] ⚠️ No se pudo obtener info de propiedad:', conv.property_id)
          }
        }

        // PROMPT 1: Asegurar fechas ISO 8601 estrictas
        const updatedAtISO = conv.updated_at ? new Date(conv.updated_at).toISOString() : new Date().toISOString()
        const lastMessageCreatedAtISO = lastMsg?.created_at ? new Date(lastMsg.created_at).toISOString() : null

        threads.push({
          conversationId: conv.id,
          otherUser: {
            id: otherUserId,
            displayName: finalDisplayName,  // PROMPT D2: garantizado no vacío, no UUID
            avatarUrl: otherProfile?.avatar_url || otherUserData?.avatar || null,
            __displayNameSource: source     // PROMPT D1: campo debug para ver fuente
          },
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.body,
            createdAt: lastMessageCreatedAtISO,  // PROMPT 1: ISO 8601 estricta
            senderId: lastMsg.sender_id,    // PROMPT 1: explícito
            isMine: lastMsg.sender_id === user.id
          } : null,
          unreadCount: unreadCount || 0,
          updatedAt: updatedAtISO,          // PROMPT 1: ISO 8601 estricta
          property: propertyInfo              // PROMPT 1: info de propiedad
        })
      }
    }

    const duration = Date.now() - startTime
    console.log(`[THREADS GET] ✅ ${threads.length} hilos en ${duration}ms usando rama ${schema}`)

    // PROMPT 2 & C & D4: Formato unificado para el cliente
    // FIX 304: Agregar headers anti-cache explícitos
    return NextResponse.json(
      {
        success: true,
        threads,
        _meta: {
          schema,
          schema_reason: schemaReason,
          count: threads.length,
          duration_ms: duration,
          version: 'v2_displayName'  // PROMPT D4: versionKey para forzar rehidratación
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    )

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

    // FIX: Verificar si el usuario tiene UserProfile antes de usar rama PRISMA
    let finalSchema = schema
    let hasUserProfile = false

    if (schema === 'PRISMA') {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('userId', user.id)
        .maybeSingle()

      hasUserProfile = !!userProfile

      // Si NO tiene UserProfile, forzar SUPABASE (no requiere UserProfile)
      if (!hasUserProfile) {
        console.log(`[SCHEMA] 🔄 Usuario ${user.id} NO tiene UserProfile, forzando rama SUPABASE`)
        finalSchema = 'SUPABASE'
      } else {
        console.log(`[SCHEMA] ✅ Usuario ${user.id} tiene UserProfile, usando rama PRISMA`)
      }
    }

    let conversationId: string | null = null
    let existing = false

    // ============================================
    // RAMA A: PRISMA (Conversation con aId/bId)
    // ============================================
    if (finalSchema === 'PRISMA') {
      // Obtener o crear UserProfile del usuario actual
      let currentProfileId: string

      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('userId', user.id)
        .maybeSingle()

      if (currentProfileError || !currentProfile) {
        console.log('[PROFILE] ⚠️ No se encontró UserProfile para usuario, creando...:', user.id)

        // Auto-crear UserProfile minimal
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            userId: user.id,
            city: 'Sin especificar',
            budgetMin: 0,
            budgetMax: 1000000,
            role: 'BUSCO'
          })
          .select('id')
          .single()

        if (createError || !newProfile) {
          console.error('[PROFILE] ❌ Error creando perfil:', createError)
          return NextResponse.json({
            error: 'DB_ERROR',
            details: `No se pudo crear perfil: ${createError?.message}`
          }, { status: 500 })
        }

        currentProfileId = newProfile.id
        console.log('[PROFILE] ✅ UserProfile creado:', currentProfileId)
      } else {
        currentProfileId = currentProfile.id
        console.log('[PROFILE] ✅ UserProfile existente:', currentProfileId)
      }

      // Obtener o crear UserProfile del usuario destino
      let targetProfileId: string

      const { data: targetProfile, error: targetProfileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('userId', toUserId)
        .maybeSingle()

      if (targetProfileError || !targetProfile) {
        console.log('[PROFILE] ⚠️ No se encontró UserProfile para usuario destino, creando...:', toUserId)

        // Auto-crear UserProfile minimal para usuario destino
        const { data: newTargetProfile, error: createTargetError } = await supabase
          .from('user_profiles')
          .insert({
            userId: toUserId,
            city: 'Sin especificar',
            budgetMin: 0,
            budgetMax: 1000000,
            role: 'BUSCO'
          })
          .select('id')
          .single()

        if (createTargetError || !newTargetProfile) {
          console.error('[PROFILE] ❌ Error creando perfil destino:', createTargetError)
          return NextResponse.json({
            error: 'DB_ERROR',
            details: `No se pudo crear perfil destino: ${createTargetError?.message}`
          }, { status: 500 })
        }

        targetProfileId = newTargetProfile.id
        console.log('[PROFILE] ✅ UserProfile destino creado:', targetProfileId)
      } else {
        targetProfileId = targetProfile.id
        console.log('[PROFILE] ✅ UserProfile destino existente:', targetProfileId)
      }

      console.log(`[PROFILE] ✅ Current: ${currentProfileId}, Target: ${targetProfileId}`)

      // Buscar conversación existente (idempotente) - siempre usar tabla Conversation para POST
      const { data: existingConv } = await supabase
        .from('Conversation')
        .select('id')
        .or(`and(aId.eq.${currentProfileId},bId.eq.${targetProfileId}),and(aId.eq.${targetProfileId},bId.eq.${currentProfileId})`)
        .eq('isActive', true)
        .single()

      if (existingConv) {
        conversationId = existingConv.id
        existing = true
        console.log(`[CONVERSATION] ✅ Existente: ${conversationId}`)
      } else {
        // Crear nueva conversación usando Prisma (bypassa RLS)
        console.log(`[CONVERSATION] Creando con Prisma para bypassar RLS`)

        try {
          const newConv = await prisma.conversation.create({
            data: {
              aId: currentProfileId,
              bId: targetProfileId,
              isActive: true
            }
          })

          conversationId = newConv.id
          existing = false
          console.log(`[CONVERSATION] ✅ Nueva creada con Prisma: ${conversationId}`)
        } catch (createError: any) {
          console.error('[DB] ❌ Error al crear conversación con Prisma:', createError)
          return NextResponse.json({
            error: 'DB_ERROR',
            details: createError.message
          }, { status: 500 })
        }
      }
    }

    // ============================================
    // RAMA B: SUPABASE (conversations con sender_id/receiver_id)
    // ============================================
    else if (finalSchema === 'SUPABASE') {
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

      // Verificar que el usuario destino existe (intentar user_profiles primero, luego users)
      // NOTA: En user_profiles, el campo 'id' ES el user_id (no hay columna user_id separada)
      const { data: targetUserProfile } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('id', toUserId)
        .maybeSingle()

      // Si no está en user_profiles, verificar en tabla users (puede ser inmobiliaria)
      if (!targetUserProfile) {
        const { data: targetUserData, error: targetUserError } = await supabase
          .from('users')
          .select('id, user_type')
          .eq('id', toUserId)
          .single()

        if (targetUserError || !targetUserData) {
          console.error('[USER] ❌ Usuario destino no encontrado en user_profiles ni users:', toUserId)
          return NextResponse.json({
            error: 'TARGET_USER_NOT_FOUND'
          }, { status: 404 })
        }

        console.log(`[USER] ✅ Usuario destino encontrado en users (${targetUserData.user_type}):`, toUserId)
      } else {
        console.log(`[USER] ✅ Usuario destino encontrado en user_profiles:`, toUserId)
      }

      // Buscar conversación existente (idempotente)
      // NOTA: La tabla Conversation usa a_id y b_id (NO participant_1/participant_2)
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(a_id.eq.${user.id},b_id.eq.${toUserId}),and(a_id.eq.${toUserId},b_id.eq.${user.id})`)
        .maybeSingle()

      if (existingConv) {
        conversationId = existingConv.id
        existing = true
        console.log(`[CONVERSATION] ✅ Existente: ${conversationId}`)
      } else {
        // CRÍTICO: La tabla Conversation requiere UserProfile.id en aId y bId
        // Si el usuario NO tiene UserProfile, crearlo automáticamente
        let currentUserProfileId: string
        let targetUserProfileId: string

        if (!hasUserProfile) {
          console.log(`[USERPROFILE] Creando UserProfile faltante para usuario ${user.id}`)

          // Crear UserProfile minimal para el usuario actual
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              userId: user.id,
              city: 'Sin especificar',
              budgetMin: 0,
              budgetMax: 1000000,
              role: 'BUSCO'
            })
            .select('id')
            .single()

          if (createError || !newProfile) {
            console.error('[USERPROFILE] ❌ Error creando perfil:', createError)
            return NextResponse.json({
              error: 'DB_ERROR',
              details: `No se pudo crear perfil de usuario: ${createError?.message}`
            }, { status: 500 })
          }

          currentUserProfileId = newProfile.id
        } else {
          // Usuario actual ya tiene UserProfile, obtener su ID
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('userId', user.id)
            .single()

          currentUserProfileId = existingProfile!.id
        }

        // Verificar/crear UserProfile para usuario destino
        const { data: targetProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('userId', toUserId)
          .maybeSingle()

        if (!targetProfile) {
          console.log(`[USERPROFILE] Creando UserProfile faltante para usuario destino ${toUserId}`)

          const { data: newTargetProfile, error: createTargetError} = await supabase
            .from('user_profiles')
            .insert({
              userId: toUserId,
              city: 'Sin especificar',
              budgetMin: 0,
              budgetMax: 1000000,
              role: 'BUSCO'
            })
            .select('id')
            .single()

          if (createTargetError || !newTargetProfile) {
            console.error('[USERPROFILE] ❌ Error creando perfil destino:', createTargetError)
            return NextResponse.json({
              error: 'DB_ERROR',
              details: `No se pudo crear perfil de usuario destino: ${createTargetError?.message}`
            }, { status: 500 })
          }

          targetUserProfileId = newTargetProfile.id
        } else {
          targetUserProfileId = targetProfile.id
        }

        // Ahora crear la conversación con los UserProfile.id correctos
        const insertData: any = {
          a_id: currentUserProfileId,
          b_id: targetUserProfileId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log(`[CONVERSATION] Creando conversación: ${currentUserProfileId} <-> ${targetUserProfileId}`)

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

        conversationId = newConv.id
        existing = false
        console.log(`[CONVERSATION] ✅ Nueva: ${conversationId}`)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[THREADS POST] ✅ conversationId: ${conversationId}, existing: ${existing}, ${duration}ms, rama: ${finalSchema}`)

    // PROMPT 1, 2 & C & D4: Respuesta unificada con conversationId
    return NextResponse.json({
      success: true,
      conversationId,
      existing,
      _meta: {
        schema: finalSchema,
        schema_reason: !hasUserProfile && schema === 'PRISMA' ? 'NO_USERPROFILE_FORCED_SUPABASE' : schemaReason,
        duration_ms: duration,
        version: 'v2_displayName'  // PROMPT D4: versionKey para forzar rehidratación
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
