import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema para obtener mensajes
const getMessagesSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
})

// GET /api/messages/[conversationId] - Obtener mensajes de una conversación
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { conversationId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const queryParams = getMessagesSchema.parse({ page, limit })

    // Verificar que la conversación existe y el usuario participa
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta conversación' },
        { status: 403 }
      )
    }

    // Calcular offset para paginación
    const offset = (queryParams.page! - 1) * queryParams.limit!

    // Obtener mensajes de la conversación
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        type,
        created_at,
        is_read,
        sender:sender_id (
          id,
          name,
          avatar
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + queryParams.limit! - 1)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Error al obtener mensajes' },
        { status: 500 }
      )
    }

    // Marcar mensajes como leídos si es necesario (solo los que no son míos)
    const unreadMessages = messages?.filter(msg => {
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      return sender?.id !== user.id && !msg.is_read
    }) || []

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id)

      // Marcar mensajes como leídos
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds)
    }

    // Obtener total para paginación
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    const total = count || 0
    const totalPages = Math.ceil(total / queryParams.limit!)

    return NextResponse.json({
      messages: messages?.reverse() || [], // Mostrar mensajes en orden cronológico
      conversation: {
        id: conversation.id
      },
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages,
        hasNextPage: queryParams.page! < totalPages,
        hasPrevPage: queryParams.page! > 1
      }
    })

  } catch (error) {
    console.error('Error in messages GET:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/messages/[conversationId] - Enviar mensaje a conversación específica
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { conversationId } = params
    const body = await request.json()

    const { content, type } = z.object({
      content: z.string().min(1, 'Contenido del mensaje es requerido').max(1000, 'Mensaje muy largo'),
      type: z.enum(['text', 'image']).optional().default('text')
    }).parse(body)

    // Verificar que la conversación existe y el usuario participa
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para enviar mensajes en esta conversación' },
        { status: 403 }
      )
    }

    // Crear el mensaje
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        content,
        type,
        created_at,
        is_read,
        sender:sender_id (
          id,
          name,
          avatar
        )
      `)
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: 'Error al enviar mensaje' },
        { status: 500 }
      )
    }

    // Actualizar la conversación con el último mensaje
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_content: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error updating conversation:', updateError)
      // No retornamos error porque el mensaje se creó correctamente
    }

    return NextResponse.json({
      success: true,
      message: newMessage
    }, { status: 201 })

  } catch (error) {
    console.error('Error in messages POST:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
