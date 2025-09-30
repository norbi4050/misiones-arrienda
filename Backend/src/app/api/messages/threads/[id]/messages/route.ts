import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/messages/threads/[id]/messages → enviar mensaje
export async function POST(
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

    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'Contenido del mensaje requerido' 
      }, { status: 400 })
    }

    // Verificar que el usuario tiene acceso a este hilo
    const { data: thread, error: threadError } = await supabase
      .from('conversations')
      .select('id, sender_id, receiver_id, property_id')
      .eq('id', threadId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })
    }

    // Obtener el perfil del usuario para el sender_id
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ 
        error: 'Perfil de usuario no encontrado' 
      }, { status: 403 })
    }

    // Crear nuevo mensaje
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: threadId,
        sender_id: userProfile.id,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        sender_id,
        content,
        created_at,
        is_read
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
      .eq('id', threadId)

    // Formatear mensaje según contrato
    const formattedMessage = {
      id: newMessage.id,
      sender_id: newMessage.sender_id,
      content: newMessage.content,
      created_at: newMessage.created_at,
      read_at: null // Nuevo mensaje, no leído aún
    }

    // Log para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📨 Mensaje enviado en hilo ${threadId}:`, {
        messageId: newMessage.id,
        senderId: userProfile.id,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      })
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage,
      threadId
    })

  } catch (error) {
    console.error('Error in thread messages POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
