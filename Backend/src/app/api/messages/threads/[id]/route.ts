import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Obtener mensajes según esquema
    const messageTable = isPrismaSchema ? 'Message' : 'messages'
    const conversationIdField = isPrismaSchema ? 'conversationId' : 'conversation_id'
    const senderIdField = isPrismaSchema ? 'senderId' : 'sender_id'
    const createdAtField = isPrismaSchema ? 'createdAt' : 'created_at'
    const isReadField = isPrismaSchema ? 'isRead' : 'is_read'
    const bodyField = isPrismaSchema ? 'body' : 'content'

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
        .order(createdAtField, { ascending: false })
        .limit(limit)
    } else {
      messagesQuery = messagesQuery
        .order(createdAtField, { ascending: false })
        .limit(limit)
    }

    const { data: messages, error: messagesError } = await messagesQuery

    if (messagesError) {
      console.error('[GET Thread] ❌ Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
    }

    // Marcar como leídos
    const profileTable = isPrismaSchema ? 'UserProfile' : 'user_profiles'
    const profileIdField = isPrismaSchema ? 'userId' : 'user_id'
    
    const { data: userProfile } = await supabase
      .from(profileTable)
      .select('id')
      .eq(profileIdField, user.id)
      .single()

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

    // Revertir orden
    const sortedMessages = (messages || []).reverse()

    // Formatear mensajes
    const formattedMessages = sortedMessages.map((message: any) => ({
      id: message.id,
      sender_id: (message as any)[senderIdField],
      content: (message as any)[bodyField],
      created_at: (message as any)[createdAtField],
      is_read: (message as any)[isReadField]
    }))

    // Información del thread para el header
    const threadInfo = {
      id: threadId,
      property_id: null,
      property_title: 'Conversación',
      property_image: null,
      other_user_id: 'unknown',
      other_user_name: 'Usuario',
      other_user_avatar: null
    }

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      thread: threadInfo,
      pagination: {
        cursor: sortedMessages.length > 0 ? (sortedMessages[0] as any)[createdAtField] : null,
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
