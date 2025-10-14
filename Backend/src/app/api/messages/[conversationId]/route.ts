import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createClient()
    const { conversationId } = params

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de conversación requerido' }, { status: 400 })
    }

    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario tiene acceso a esta conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, property_id, sender_id, receiver_id')
      .eq('id', conversationId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
    }

    // Obtener mensajes de la conversación con información del remitente
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        created_at,
        sender:user_profiles!messages_sender_id_fkey(
          id,
          full_name,
          photos
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
    }

    // Formatear mensajes para el frontend
    const formattedMessages = messages?.map((message: any) => ({
      id: message.id,
      content: message.content,
      sender_id: message.sender_id,
      created_at: message.created_at,
      sender: {
        id: message.sender?.id,
        full_name: message.sender?.full_name,
        avatar_url: message.sender?.photos?.[0] || null
      }
    })) || []

    return NextResponse.json({
      messages: formattedMessages,
      conversation: {
        id: conversation.id,
        property_id: conversation.property_id
      },
      success: true
    })

  } catch (error) {
    console.error('Error in messages GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createClient()
    const { conversationId } = params

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de conversación requerido' }, { status: 400 })
    }

    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { content, type = 'text' } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Contenido del mensaje requerido' }, { status: 400 })
    }

    // Verificar que el usuario tiene acceso a esta conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, sender_id, receiver_id')
      .eq('id', conversationId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
    }

    // Crear nuevo mensaje
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        type: type
      })
      .select(`
        id,
        content,
        sender_id,
        created_at,
        sender:user_profiles!messages_sender_id_fkey(
          id,
          full_name,
          photos
        )
      `)
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
    }

    // Actualizar timestamp de conversación
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Formatear mensaje para respuesta
    const senderData = Array.isArray(newMessage.sender) ? newMessage.sender[0] : newMessage.sender
    const formattedMessage = {
      id: newMessage.id,
      content: newMessage.content,
      sender_id: newMessage.sender_id,
      created_at: newMessage.created_at,
      sender: {
        id: senderData?.id,
        full_name: senderData?.full_name,
        avatar_url: senderData?.photos?.[0] || null
      }
    }

    return NextResponse.json({
      message: formattedMessage,
      conversation_id: conversationId,
      success: true
    })

  } catch (error) {
    console.error('Error in messages POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
