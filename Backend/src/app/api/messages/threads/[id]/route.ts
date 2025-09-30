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

    // Verificar que el usuario tiene acceso a este hilo
    const { data: thread, error: threadError } = await supabase
      .from('conversations')
      .select(`
        id, 
        sender_id, 
        receiver_id, 
        property_id,
        property:properties(id, title, images),
        other_user:user_profiles!conversations_receiver_id_fkey(id, full_name, photos)
      `)
      .eq('id', threadId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })
    }

    // Construir query de mensajes con cursor
    let messagesQuery = supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        created_at,
        is_read,
        sender:user_profiles!messages_sender_id_fkey(
          id,
          full_name,
          photos
        )
      `)
      .eq('conversation_id', threadId)

    // Si hay cursor, obtener mensajes anteriores (orden descendente para fetch)
    if (cursor) {
      messagesQuery = messagesQuery
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(limit)
    } else {
      // Sin cursor, obtener los más recientes (orden descendente para fetch)
      messagesQuery = messagesQuery
        .order('created_at', { ascending: false })
        .limit(limit)
    }

    const { data: messages, error: messagesError } = await messagesQuery

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
    }

    // Marcar como leídos los mensajes recibidos por el usuario
    const messagesToMarkRead = (messages || [])
      .filter((msg: any) => msg.sender_id !== user.id && !msg.is_read)
      .map((msg: any) => msg.id)

    if (messagesToMarkRead.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messagesToMarkRead)
    }

    // Revertir orden para render (ascendente = más antiguo primero)
    const sortedMessages = (messages || []).reverse()

    // Formatear mensajes según contrato
    const formattedMessages = sortedMessages.map((message: any) => ({
      id: message.id,
      sender_id: message.sender_id,
      sender_name: message.sender?.full_name || 'Usuario',
      sender_avatar: message.sender?.photos?.[0] || null,
      content: message.content,
      created_at: message.created_at,
      is_read: message.is_read
    }))

    // Información del thread para el header
    const otherUserId = thread.sender_id === user.id ? thread.receiver_id : thread.sender_id
    const property = Array.isArray(thread.property) ? thread.property[0] : thread.property
    const otherUser = Array.isArray(thread.other_user) ? thread.other_user[0] : thread.other_user
    
    const threadInfo = {
      id: thread.id,
      property_id: thread.property_id,
      property_title: property?.title || 'Propiedad',
      property_image: property?.images?.[0] || null,
      other_user_id: otherUserId,
      other_user_name: otherUser?.full_name || 'Usuario',
      other_user_avatar: otherUser?.photos?.[0] || null
    }

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      thread: threadInfo,
      pagination: {
        cursor: sortedMessages.length > 0 ? sortedMessages[0].created_at : null,
        limit,
        hasMore: formattedMessages.length === limit
      }
    })

  } catch (error) {
    console.error('Error in thread GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
