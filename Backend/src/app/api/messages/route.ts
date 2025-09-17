import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema para obtener conversaciones
const getConversationsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional()
})

// Schema para enviar mensaje
const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'ID de conversación es requerido'),
  content: z.string().min(1, 'Contenido del mensaje es requerido').max(1000, 'Mensaje muy largo'),
  type: z.enum(['text', 'image']).optional().default('text')
})

// GET /api/messages - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const params = getConversationsSchema.parse({ page, limit })

    // Calcular offset para paginación
    const offset = (params.page! - 1) * params.limit!

    // Obtener conversaciones donde el usuario participa
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        user1_id,
        user2_id,
        last_message_content,
        last_message_at,
        user1:user1_id (
          id,
          name,
          avatar
        ),
        user2:user2_id (
          id,
          name,
          avatar
        )
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .range(offset, offset + params.limit! - 1)

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json(
        { error: 'Error al obtener conversaciones' },
        { status: 500 }
      )
    }

    // Procesar conversaciones para mostrar el otro usuario y calcular no leídos
    const processedConversations = await Promise.all(
      (conversations || []).map(async (conversation: any) => {
        const otherUser = conversation.user1_id === user.id ? conversation.user2 : conversation.user1
        
        // Calcular mensajes no leídos para este usuario
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', user.id)

        return {
          id: conversation.id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          last_message_content: conversation.last_message_content,
          last_message_at: conversation.last_message_at,
          unread_count: unreadCount || 0,
          other_user: otherUser
        }
      })
    )

    // Obtener total para paginación
    const { count, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    const total = count || 0
    const totalPages = Math.ceil(total / params.limit!)

    return NextResponse.json({
      conversations: processedConversations,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNextPage: params.page! < totalPages,
        hasPrevPage: params.page! > 1
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

// POST /api/messages - Enviar mensaje
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { conversationId, content, type } = sendMessageSchema.parse(body)

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
      message: newMessage,
      conversation_id: conversationId
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

// PUT /api/messages - Marcar mensajes como leídos
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { conversationId } = z.object({
      conversationId: z.string().min(1)
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
        { error: 'No tienes permisos para modificar esta conversación' },
        { status: 403 }
      )
    }

    // Marcar mensajes como leídos (solo los que no son míos)
    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false)

    if (updateError) {
      console.error('Error marking messages as read:', updateError)
      return NextResponse.json(
        { error: 'Error al marcar mensajes como leídos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mensajes marcados como leídos'
    })

  } catch (error) {
    console.error('Error in messages PUT:', error)

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
