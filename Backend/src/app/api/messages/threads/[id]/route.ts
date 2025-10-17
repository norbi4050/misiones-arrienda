// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDisplayName, getDisplayNameWithSource, isUUID } from '@/lib/messages/display-name-helper'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'
import { getUserPresence } from '@/lib/presence/activity-tracker'

// GET /api/messages/threads/[id] → mensajes paginados del hilo con cursor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: conversationId } = params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') // ISO date or message ID
    const limit = parseInt(searchParams.get('limit') || '30')

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Detectar esquema: intentar primero PRISMA
    let thread: any = null
    let isPrismaSchema = false

    // Intentar con Conversation (PRISMA)
    const { data: prismaThread } = await supabase
      .from('Conversation')
      .select('id, aId, bId, isActive')
      .eq('id', conversationId)
      .eq('isActive', true)
      .single()

    if (prismaThread) {
      const { data: userProfile } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', user.id)
        .single()

      if (userProfile && (prismaThread.aId === userProfile.id || prismaThread.bId === userProfile.id)) {
        thread = prismaThread
        isPrismaSchema = true
      }
    }

    // Si no se encontró, intentar con conversations (SUPABASE)
    if (!thread) {
      const { data: supabaseThread } = await supabase
        .from('conversations')
        .select('id, a_id, b_id, participant_1, participant_2')
        .eq('id', conversationId)
        .or(`a_id.eq.${user.id},b_id.eq.${user.id},participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .single()

      if (supabaseThread) {
        // Verificar que el usuario es participante
        const isParticipant = 
          supabaseThread.a_id === user.id ||
          supabaseThread.b_id === user.id ||
          supabaseThread.participant_1 === user.id ||
          supabaseThread.participant_2 === user.id
        
        if (isParticipant) {
          thread = supabaseThread
          isPrismaSchema = false
        }
      }
    }

    if (!thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })
    }

    console.log(`[GET Thread] ✅ Schema: ${isPrismaSchema ? 'PRISMA' : 'SUPABASE'}`)

    // FIX: Verificar user_type antes de requerir UserProfile
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const userType = userData?.user_type?.toLowerCase()
    const isInmobiliaria = userType === 'inmobiliaria' || userType === 'agency'

    // Obtener perfil del usuario actual (solo si NO es inmobiliaria)
    let userProfile: any = null
    let userProfileId: string

    if (isInmobiliaria) {
      // Para inmobiliarias, usar directamente user.id
      userProfileId = user.id
      console.log(`[GET Thread] Usuario inmobiliaria detectado, usando user.id: ${user.id}`)
    } else {
      // Para inquilinos/busco, buscar en UserProfile
      const profileTable = isPrismaSchema ? 'UserProfile' : 'user_profiles'
      const profileIdField = isPrismaSchema ? 'userId' : 'user_id'

      const { data: profile } = await supabase
        .from(profileTable)
        .select('id')
        .eq(profileIdField, user.id)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
      }

      userProfile = profile
      userProfileId = profile.id
    }

    // PROMPT 1: Determinar el otro usuario (PROFILE ID, no USER ID)
    const otherProfileId = isPrismaSchema
      ? (thread.aId === userProfileId ? thread.bId : thread.aId)
      : null  // Para Supabase, otherUserId es directamente el user_id

    // FIX: Usar campos correctos de Supabase (a_id, b_id, participant_1, participant_2)
    const otherUserId = isPrismaSchema 
      ? null  // Lo obtendremos del UserProfile
      : (thread.a_id === user.id 
          ? (thread.b_id || thread.participant_2)
          : (thread.a_id || thread.participant_1))

    // PROMPT 1: Obtener datos completos del otro usuario
    let otherProfile: any = null
    let otherUserData: any = null

    if (isPrismaSchema) {
      // ✅ FIX: Buscar UserProfile por ID (no por userId)
      const { data: profile } = await supabase
        .from('UserProfile')
        .select('id, userId')
        .eq('id', otherProfileId)
        .single()
      otherProfile = profile

      if (profile?.userId) {
        const { data: userData } = await supabase
          .from('User')
          .select('id, name, email, avatar, companyName')
          .eq('id', profile.userId)
          .single()
        otherUserData = userData
      }
    } else {
      // NOTA: En user_profiles, el campo 'id' ES el user_id (no hay columna user_id separada)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, profile_updated_at')
        .eq('id', otherUserId)
        .single()
      otherProfile = profile

      try {
        const { data: userData } = await supabase
          .from('User')
          .select('id, name, email, avatar, companyName')
          .eq('id', otherUserId)
          .single()
        otherUserData = userData
      } catch {
        // Si no existe tabla User, usar solo user_profiles
      }
    }

    // PROMPT D1 & D2: Calcular displayName con source tracking
    const { displayName, source } = getDisplayNameWithSource(
      otherUserData || { email: otherProfile?.userId || otherUserId || 'unknown' },
      null  // ✅ FIX: UserProfile no tiene full_name, usar solo User data
    )

    // PROMPT D1: Log detallado de displayName resolution
    const finalOtherUserId = otherUserData?.id || otherProfile?.userId || otherUserId
    console.log(`[DISPLAYNAME] conversationId=${conversationId}, me.id=${user.id}, otherUser.id=${finalOtherUserId}, otherUser.displayName="${displayName}", sourceUsed=${source}`)
    
    // PROMPT D1: Warning si displayName está vacío o es UUID
    if (!displayName || displayName.trim() === '' || isUUID(displayName)) {
      console.warn(`[DisplayName] MISSING → payload would fallback to conversationId for conversation=${conversationId}`)
    }

    // PROMPT D6: Check preventivo antes de responder
    let finalDisplayName = displayName
    if (!finalDisplayName || finalDisplayName.trim() === '' || isUUID(finalDisplayName)) {
      console.warn(`[DisplayName] FALLBACK APPLIED for userId=${otherUserData?.id || otherUserId}`)
      finalDisplayName = 'Usuario'
    }

    // PROMPT D6: Log de DATA GAP si faltan datos en DB
    if (!otherUserData?.name && !otherUserData?.companyName) {
      console.warn(`[DisplayName] DATA GAP userId=${finalOtherUserId} - no name/companyName in DB`)
    }

    // Obtener mensajes según esquema
    const messageTable = isPrismaSchema ? 'Message' : 'messages'
    const conversationIdField = isPrismaSchema ? 'conversationId' : 'conversation_id'
    const senderIdField = isPrismaSchema ? 'senderId' : 'sender_id'
    const createdAtField = isPrismaSchema ? 'createdAt' : 'created_at'
    const isReadField = isPrismaSchema ? 'isRead' : 'is_read'
    const bodyField = 'body'  // Siempre 'body' en ambos schemas

    // ✅ FIX PAGINACIÓN: Traer últimos N mensajes por defecto (más recientes)
    // Si hay cursor (load older), traer mensajes anteriores a ese cursor
    let messagesQuery = supabase
      .from(messageTable)
      .select(`
        id,
        ${senderIdField},
        ${bodyField},
        ${createdAtField},
        ${isReadField}
      `, { count: 'exact' })
      .eq(conversationIdField, conversationId)

    if (cursor) {
      // Cargar mensajes más antiguos (antes del cursor)
      messagesQuery = messagesQuery
        .lt(createdAtField, cursor)
        .order(createdAtField, { ascending: false })
        .limit(limit)
    } else {
      // Primera carga: traer los últimos N mensajes (más recientes)
      messagesQuery = messagesQuery
        .order(createdAtField, { ascending: false })
        .limit(limit)
    }

    const { data: messagesData, error: messagesError, count: totalCount } = await messagesQuery

    if (messagesError) {
      console.error('[GET Thread] ❌ Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
    }

    // ✅ FIX: Revertir orden para UI (ascendente = cronológico)
    const messages = (messagesData || []).reverse()

    // Marcar como leídos
    if (userProfileId) {
      const messagesToMarkRead = (messages || [])
        .filter((msg: any) => (msg as any)[senderIdField] !== userProfileId && !(msg as any)[isReadField])
        .map((msg: any) => msg.id)

      if (messagesToMarkRead.length > 0) {
        const updateData: any = { [isReadField]: true }
        await supabase
          .from(messageTable)
          .update(updateData)
          .in('id', messagesToMarkRead)
      }
    }

    // PROMPT 1: Formatear mensajes con isMine calculado server-side y fechas ISO 8601 estrictas
    const formattedMessages = (messages || []).map((message: any) => {
      const createdAtRaw = (message as any)[createdAtField]
      const createdAtISO = createdAtRaw ? new Date(createdAtRaw).toISOString() : new Date().toISOString()
      
      const messageSenderId = (message as any)[senderIdField]
      
      // ✅ FIX CRÍTICO: Comparar correctamente según el esquema
      // PRISMA: senderId es PROFILE ID → comparar con userProfileId
      // SUPABASE: sender_id es USER ID → comparar con user.id
      const isMine = isPrismaSchema
        ? messageSenderId === userProfileId  // PRISMA: PROFILE ID
        : messageSenderId === user.id         // SUPABASE: USER ID
      
      return {
        id: message.id,
        content: (message as any)[bodyField],
        createdAt: createdAtISO,  // ← PROMPT 1: ISO 8601 estricta
        senderId: messageSenderId,
        isMine  // ← FIX: Ahora compara correctamente según esquema
      }
    })

    // Obtener adjuntos si existen
    const messageIds = formattedMessages.map(m => m.id)
    console.log('[GET Thread] Fetching attachments for message IDs:', messageIds.length)
    
    const attachmentsMap = await getMessagesAttachments(messageIds)
    console.log('[GET Thread] Attachments map size:', attachmentsMap.size)
    console.log('[GET Thread] Attachments map entries:', Array.from(attachmentsMap.entries()).map(([id, atts]) => ({ messageId: id, count: atts.length })))
    
    // Agregar attachments a cada mensaje
    const messagesWithAttachments = formattedMessages.map(msg => {
      const attachments = attachmentsMap.get(msg.id) || []
      console.log(`[GET Thread] Message ${msg.id} has ${attachments.length} attachments`)
      return {
        ...msg,
        attachments
      }
    })

    // PROMPT D1 & D2: Información enriquecida del thread para el header
    // NOTA: Priorizar user_profiles.avatar_url sobre User.avatar porque user_profiles es la fuente correcta
    
    // ✅ FIX CRÍTICO: Buscar avatar en user_profiles primero, independientemente del esquema
    let finalAvatarUrl: string | null = null
    
    if (isPrismaSchema && otherProfile?.userId) {
      // Para PRISMA: buscar en user_profiles usando el userId del UserProfile
      const { data: userProfilesData } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', otherProfile.userId)
        .single()
      
      console.log(`[AVATAR DEBUG] Buscando avatar en user_profiles para id: ${otherProfile.userId}`)
      console.log(`[AVATAR DEBUG] Datos de user_profiles:`, userProfilesData)
      
      finalAvatarUrl = userProfilesData?.avatar_url || otherUserData?.avatar || null
      
      console.log(`[AVATAR DEBUG] Final avatarUrl: ${finalAvatarUrl}, from userProfilesData: ${userProfilesData?.avatar_url}, from User: ${otherUserData?.avatar}`)
    } else {
      // Para SUPABASE: usar directamente user_profiles
      finalAvatarUrl = otherProfile?.avatar_url || null
    }
    
    // ONLINE STATUS: Obtener información de presencia del otro usuario
    const presence = await getUserPresence(finalOtherUserId)
    
    const threadInfo = {
      conversationId,
      otherUser: {
        id: finalOtherUserId,
        displayName: finalDisplayName,  // PROMPT D2: garantizado no vacío, no UUID
        avatarUrl: finalAvatarUrl,
        presence: presence ? {
          isOnline: presence.isOnline,
          lastSeen: presence.lastSeen,
          lastActivity: presence.lastActivity
        } : undefined,  // Opcional para compatibilidad
        __displayNameSource: source  // PROMPT D1: campo debug para ver fuente
      }
    }

    // ✅ FIX PAGINACIÓN: Calcular hasMoreOlder correctamente
    const hasMoreOlder = totalCount ? totalCount > formattedMessages.length : false

    return NextResponse.json({
      success: true,
      messages: messagesWithAttachments,
      thread: threadInfo,
      pagination: {
        cursor: formattedMessages.length > 0 ? formattedMessages[0].createdAt : null,
        limit,
        hasMore: hasMoreOlder,
        total: totalCount || 0
      }
    })

  } catch (error) {
    console.error('[GET Thread] ❌ Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PATCH /api/messages/threads/[id] → marcar mensajes como leídos
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: conversationId } = params

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // El body puede venir vacío o con { action: 'mark_read' } o { messageIds: [...] }
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // Body vacío está OK, marcaremos todos los mensajes no leídos
    }

    // Detectar esquema
    let isPrismaSchema = false
    const { data: prismaThread } = await supabase
      .from('Conversation')
      .select('id')
      .eq('id', conversationId)
      .single()

    if (prismaThread) {
      isPrismaSchema = true
    }

    const messageTable = isPrismaSchema ? 'Message' : 'messages'
    const conversationIdField = isPrismaSchema ? 'conversationId' : 'conversation_id'
    const senderIdField = isPrismaSchema ? 'senderId' : 'sender_id'
    const isReadField = isPrismaSchema ? 'isRead' : 'is_read'

    // FIX: Verificar user_type antes de requerir UserProfile
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const userType = userData?.user_type?.toLowerCase()
    const isInmobiliaria = userType === 'inmobiliaria' || userType === 'agency'

    // Obtener perfil del usuario (solo si NO es inmobiliaria)
    let userProfileId: string

    if (isInmobiliaria) {
      // Para inmobiliarias, usar directamente user.id
      userProfileId = user.id
      console.log(`[PATCH Thread] Usuario inmobiliaria detectado, usando user.id: ${user.id}`)
    } else {
      // Para inquilinos/busco, buscar en UserProfile
      const profileTable = isPrismaSchema ? 'UserProfile' : 'user_profiles'
      const profileIdField = isPrismaSchema ? 'userId' : 'user_id'

      const { data: userProfile } = await supabase
        .from(profileTable)
        .select('id')
        .eq(profileIdField, user.id)
        .single()

      if (!userProfile) {
        return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
      }

      userProfileId = userProfile.id
    }

    const updateData: any = { [isReadField]: true }
    
    // Si se proporcionan messageIds específicos, marcar solo esos
    if (body.messageIds && Array.isArray(body.messageIds) && body.messageIds.length > 0) {
      const { error: updateError } = await supabase
        .from(messageTable)
        .update(updateData)
        .in('id', body.messageIds)

      if (updateError) {
        console.error('[PATCH Thread] ❌ Error marking specific messages:', updateError)
        return NextResponse.json({ error: 'Error al marcar como leído' }, { status: 500 })
      }

      console.log(`[PATCH Thread] ✅ Marked ${body.messageIds.length} specific messages as read`)

      return NextResponse.json({
        success: true,
        markedCount: body.messageIds.length
      })
    }

    // Si no hay messageIds, marcar todos los mensajes no leídos del thread que no son del usuario
      const { error: updateError, count } = await supabase
      .from(messageTable)
      .update(updateData)
      .eq(conversationIdField, conversationId)
      .neq(senderIdField, userProfileId)
      .eq(isReadField, false)

    if (updateError) {
      console.error('[PATCH Thread] ❌ Error marking all as read:', updateError)
      return NextResponse.json({ error: 'Error al marcar como leído' }, { status: 500 })
    }

    console.log(`[PATCH Thread] ✅ Marked ${count || 0} messages as read in conversation`)

    return NextResponse.json({
      success: true,
      markedCount: count || 0
    })

  } catch (error) {
    console.error('[PATCH Thread] ❌ Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
