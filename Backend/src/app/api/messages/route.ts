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

    // TEMPORAL: Sistema de mensajes deshabilitado por problemas de schema
    console.log('Sistema de mensajes temporalmente deshabilitado - schema no configurado')
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
