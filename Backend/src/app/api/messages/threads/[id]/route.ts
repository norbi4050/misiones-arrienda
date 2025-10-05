import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDisplayName, getDisplayNameWithSource, isUUID } from '@/lib/messages/display-name-helper'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'

// GET /api/messages/threads/[id] → mensajes paginados del hilo con cursor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: threadId } = params
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
      .eq('id', threadId)
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
        .select('id, sender_id, receiver_id, property_id')
        .eq('id', threadId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .single()

      if (supabaseThread) {
        thread = supabaseThread
        isPrismaSchema = false
      }
    }

    if (!thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })
    }

    console.log(`[GET Thread] ✅ Schema: ${isPrismaSchema ? 'PRISMA' : 'SUPABASE'}`)

    // Obtener perfil del usuario actual
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

    // PROMPT 1: Determinar el otro usuario
    const otherUserId = isPrismaSchema 
      ? (thread.aId === userProfile.id ? thread.bId : thread.aId)
      : (thread.sender_id === user.id ? thread.receiver_id : thread.sender_id)

    // PROMPT 1: Obtener datos completos del otro usuario
    let otherProfile: any = null
    let otherUserData: any = null

    if (isPrismaSchema) {
      const { data: profile } = await supabase
        .from('UserProfile')
        .select('id, userId, full_name, companyName')
        .eq('id', otherUserId)
        .single()
      otherProfile = profile

      if (profile?.userId) {
        const { data: userData } = await supabase
          .from('User')
          .select('id, name, email, avatar')
          .eq('id', profile.userId)
          .single()
        otherUserData = userData
      }
    } else {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, company_name, photos')
        .eq('user_id', otherUserId)
        .single()
      otherProfile = profile

      try {
        const { data: userData } = await supabase
          .from('User')
          .select('id, name, email, avatar')
          .eq('id', otherUserId)
          .single()
        otherUserData = userData
      } catch {
        // Si no existe tabla User, usar solo user_profiles
      }
    }

    // PROMPT D1 & D2: Calcular displayName con source tracking
    const { displayName, source } = getDisplayNameWithSource(
      otherUserData || { email: otherUserId },
      otherProfile ? {
        full_name: otherProfile.full_name,
        companyName: otherProfile.companyName,
        company_name: otherProfile.company_name
      } : null
    )

    // PROMPT D1: Log detallado de displayName resolution
    console.log(`[DISPLAYNAME] threadId=${threadId}, me.id=${user.id}, otherUser.id=${otherUserData?.id || otherUserId}, otherUser.displayName="${displayName}", sourceUsed=${source}`)
    
    // PROMPT D1: Warning si displayName está vacío o es UUID
    if (!displayName || displayName.trim() === '' || isUUID(displayName)) {
      console.warn(`[DisplayName] MISSING → payload would fallback to threadId for thread=${threadId}`)
    }

    // PROMPT D6: Check preventivo antes de responder
    let finalDisplayName = displayName
    if (!finalDisplayName || finalDisplayName.trim() === '' || isUUID(finalDisplayName)) {
      console.warn(`[DisplayName] FALLBACK APPLIED for userId=${otherUserData?.id || otherUserId}`)
      finalDisplayName = 'Usuario'
    }

    // PROMPT D6: Log de DATA GAP si faltan datos en DB
    if (!otherUserData?.name && !otherProfile?.companyName && !otherProfile?.company_name && !otherProfile?.full_name) {
      console.warn(`[DisplayName] DATA GAP userId=${otherUserData?.id || otherUserId} - no name/companyName/full_name in DB`)
    }

    // Obtener mensajes según esquema
    const messageTable = isPrismaSchema ? 'Message' : 'messages'
    const conversationIdField = isPrismaSchema ? 'conversationId' : 'conversation_id'
    const senderIdField = isPrismaSchema ? 'senderId' : 'sender_id'
    const createdAtField = isPrismaSchema ? 'createdAt' : 'created_at'
    const isReadField = isPrismaSchema ? 'isRead' : 'is_read'
    const bodyField = isPrismaSchema ? 'body' : 'content'

    // PROMPT 1: Orden ascendente (más antiguos primero)
    let messagesQuery = supabase
      .from(messageTable)
      .select(`
        id,
        ${senderIdField},
        ${bodyField},
        ${createdAtField},
        ${isReadField}
      `)
      .eq(conversationIdField, threadId)

    if (cursor) {
      messagesQuery = messagesQuery
        .lt(createdAtField, cursor)
        .order(createdAtField, { ascending: true })  // ← PROMPT 1: Ascendente
        .limit(limit)
    } else {
      messagesQuery = messagesQuery
        .order(createdAtField, { ascending: true })  // ← PROMPT 1: Ascendente
        .limit(limit)
    }

    const { data: messages, error: messagesError } = await messagesQuery

    if (messagesError) {
      console.error('[GET Thread] ❌ Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
    }

    // Marcar como leídos
    if (userProfile) {
      const messagesToMarkRead = (messages || [])
        .filter((msg: any) => (msg as any)[senderIdField] !== userProfile.id && !(msg as any)[isReadField])
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
      
      return {
        id: message.id,
        content: (message as any)[bodyField],
        createdAt: createdAtISO,  // ← PROMPT 1: ISO 8601 estricta
        senderId: (message as any)[senderIdField],
        isMine: (message as any)[senderIdField] === userProfile.id  // ← PROMPT 1: calculado server-side
      }
    })

    // Obtener adjuntos si existen
    const messageIds = formattedMessages.map(m => m.id)
    const attachmentsMap = await getMessagesAttachments(messageIds)
    
    // Agregar attachments a cada mensaje
    const messagesWithAttachments = formattedMessages.map(msg => ({
      ...msg,
      attachments: attachmentsMap.get(msg.id) || []
    }))

    // PROMPT D1 & D2: Información enriquecida del thread para el header
    const threadInfo = {
      threadId,
      otherUser: {
        id: otherUserData?.id || otherUserId,
        displayName: finalDisplayName,  // PROMPT D2: garantizado no vacío, no UUID
        avatarUrl: isPrismaSchema 
          ? (otherUserData?.avatar || null)
          : (otherProfile?.photos?.[0] || otherUserData?.avatar || null),
        __displayNameSource: source  // PROMPT D1: campo debug para ver fuente
      }
    }

    return NextResponse.json({
      success: true,
      messages: messagesWithAttachments,
      thread: threadInfo,
      pagination: {
        cursor: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1].createdAt : null,
        limit,
        hasMore: formattedMessages.length === limit
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
    const { id: threadId } = params

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
      .eq('id', threadId)
      .single()

    if (prismaThread) {
      isPrismaSchema = true
    }

    const messageTable = isPrismaSchema ? 'Message' : 'messages'
    const conversationIdField = isPrismaSchema ? 'conversationId' : 'conversation_id'
    const senderIdField = isPrismaSchema ? 'senderId' : 'sender_id'
    const isReadField = isPrismaSchema ? 'isRead' : 'is_read'

    // Obtener perfil del usuario
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
      .eq(conversationIdField, threadId)
      .neq(senderIdField, userProfile.id)
      .eq(isReadField, false)

    if (updateError) {
      console.error('[PATCH Thread] ❌ Error marking all as read:', updateError)
      return NextResponse.json({ error: 'Error al marcar como leído' }, { status: 500 })
    }

    console.log(`[PATCH Thread] ✅ Marked ${count || 0} messages as read in thread`)

    return NextResponse.json({
      success: true,
      markedCount: count || 0
    })

  } catch (error) {
    console.error('[PATCH Thread] ❌ Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
