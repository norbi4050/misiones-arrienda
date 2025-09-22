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

    // Primero obtener el perfil del usuario autenticado desde la tabla users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.log('Sistema de mensajes no disponible - perfil de usuario no configurado')
      return NextResponse.json({
        conversations: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const params = getConversationsSchema.parse({ page, limit })

    // Calcular offset para paginación
    const offset = (params.page! - 1) * params.limit!

    // Obtener conversaciones donde el usuario participa usando su UserProfile ID
    const { data: conversations, error: conversationsError } = await supabase
      .from('Conversation')
      .select(`
        id,
        created_at,
        updated_at,
        aId,
        bId,
        lastMessageAt,
        a:UserProfile!Conversation_aId_fkey (
          id,
          userId,
          city,
          role
        ),
        b:UserProfile!Conversation_bId_fkey (
          id,
          userId,
          city,
          role
        )
      `)
      .or(`aId.eq.${userProfile.id},bId.eq.${userProfile.id}`)
      .order('lastMessageAt', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .range(offset, offset + params.limit! - 1)

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json(
        { error: 'Error al obtener conversaciones', details: conversationsError.message },
        { status: 500 }
      )
    }

    // Procesar conversaciones para mostrar el otro usuario y calcular no leídos
    const processedConversations = await Promise.all(
      (conversations || []).map(async (conversation: any) => {
        const otherUserProfile = conversation.aId === userProfile.id ? conversation.b : conversation.a
        
        // Calcular mensajes no leídos para este usuario
        const { count: unreadCount } = await supabase
          .from('Message')
          .select('*', { count: 'exact', head: true })
          .eq('conversationId', conversation.id)
          .eq('isRead', false)
          .neq('senderId', userProfile.id)

        return {
          id: conversation.id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          last_message_at: conversation.lastMessageAt,
          unread_count: unreadCount || 0,
          other_user: {
            id: otherUserProfile?.userId,
            name: `Usuario ${otherUserProfile?.city}`,
            avatar: null,
            role: otherUserProfile?.role
          }
        }
      })
    )

    // Obtener total para paginación
    const { count, error: countError } = await supabase
      .from('Conversation')
      .select('*', { count: 'exact', head: true })
      .or(`aId.eq.${userProfile.id},bId.eq.${userProfile.id}`)

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

    // Obtener el perfil del usuario autenticado desde la tabla users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no configurado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { conversationId, content, type } = sendMessageSchema.parse(body)

    // Verificar que la conversación existe y el usuario participa
    const { data: conversation, error: conversationError } = await supabase
      .from('Conversation')
      .select('id, aId, bId')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.aId !== userProfile.id && conversation.bId !== userProfile.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para enviar mensajes en esta conversación' },
        { status: 403 }
      )
    }

    // Crear el mensaje
    const { data: newMessage, error: messageError } = await supabase
      .from('Message')
      .insert({
        conversationId: conversationId,
        senderId: userProfile.id,
        body: content,
        isRead: false,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        body,
        created_at,
        isRead,
        senderId
      `)
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: 'Error al enviar mensaje', details: messageError.message },
        { status: 500 }
      )
    }

    // Actualizar la conversación con el último mensaje
    const { error: updateError } = await supabase
      .from('Conversation')
      .update({
        lastMessageAt: new Date().toISOString(),
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

    // Obtener el perfil del usuario autenticado desde la tabla users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no configurado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { conversationId } = z.object({
      conversationId: z.string().min(1)
    }).parse(body)

    // Verificar que la conversación existe y el usuario participa
    const { data: conversation, error: conversationError } = await supabase
      .from('Conversation')
      .select('id, aId, bId')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.aId !== userProfile.id && conversation.bId !== userProfile.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta conversación' },
        { status: 403 }
      )
    }

    // Marcar mensajes como leídos (solo los que no son míos)
    const { error: updateError } = await supabase
      .from('Message')
      .update({ isRead: true })
      .eq('conversationId', conversationId)
      .neq('senderId', userProfile.id)
      .eq('isRead', false)

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
