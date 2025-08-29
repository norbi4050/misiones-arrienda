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

// GET /api/comunidad/messages - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
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
      .from('community_conversations')
      .select(`
        id,
        created_at,
        updated_at,
        user1_id,
        user2_id,
        last_message_content,
        last_message_at,
        unread_count_user1,
        unread_count_user2,
        match:match_id (
          id,
          status
        ),
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
      .order('updated_at', { ascending: false })
      .range(offset, offset + params.limit! - 1)

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json(
        { error: 'Error al obtener conversaciones' },
        { status: 500 }
      )
    }

    // Procesar conversaciones para mostrar el otro usuario
    const processedConversations = conversations?.map(conversation => {
      const otherUser = conversation.user1_id === user.id ? conversation.user2 : conversation.user1
      const unreadCount = conversation.user1_id === user.id 
        ? conversation.unread_count_user1 
        : conversation.unread_count_user2

      return {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message_content: conversation.last_message_content,
        last_message_at: conversation.last_message_at,
        unread_count: unreadCount || 0,
        match: conversation.match,
        other_user: otherUser
      }
    }) || []

    // Obtener total para paginación
    const { count, error: countError } = await supabase
      .from('community_conversations')
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

// POST /api/comunidad/messages - Enviar mensaje
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
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
      .from('community_conversations')
      .select('id, user1_id, user2_id, match_id')
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

    // Verificar que el match sigue activo
    const { data: match, error: matchError } = await supabase
      .from('community_matches')
      .select('status')
      .eq('id', conversation.match_id)
      .single()

    if (matchError || !match || match.status !== 'active') {
      return NextResponse.json(
        { error: 'No puedes enviar mensajes en un match inactivo' },
        { status: 400 }
      )
    }

    // Crear el mensaje
    const { data: newMessage, error: messageError } = await supabase
      .from('community_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        content,
        type,
        created_at,
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
    const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id
    const unreadField = conversation.user1_id === user.id ? 'unread_count_user2' : 'unread_count_user1'

    const { error: updateError } = await supabase
      .from('community_conversations')
      .update({
        last_message_content: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        [unreadField]: supabase.rpc('increment_unread', { conversation_id: conversationId, user_field: unreadField })
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

// PUT /api/comunidad/messages - Marcar mensajes como leídos
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
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
      .from('community_conversations')
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

    // Marcar mensajes como leídos
    const unreadField = conversation.user1_id === user.id ? 'unread_count_user1' : 'unread_count_user2'

    const { error: updateError } = await supabase
      .from('community_conversations')
      .update({
        [unreadField]: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

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
