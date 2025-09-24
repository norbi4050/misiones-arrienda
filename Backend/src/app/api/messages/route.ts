import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Simular obtención de userId (en producción usar JWT)
    const userId = authHeader.replace('Bearer ', '')

    // Obtener conversaciones del usuario
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        property_id,
        created_at,
        updated_at,
        properties(
          id,
          title,
          images
        ),
        messages(
          id,
          content,
          created_at,
          sender_id,
          profiles(
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Error al cargar conversaciones' }, { status: 500 })
    }

    // Formatear conversaciones para el frontend
    const formattedConversations = conversations?.map((conv: any) => {
      const lastMessage = conv.messages?.[0]
      const otherUser = lastMessage?.profiles
      const property = conv.properties

      return {
        id: conv.id,
        property_id: conv.property_id,
        property_title: property?.title || 'Propiedad sin título',
        property_image: property?.images?.[0] || null,
        other_user_name: otherUser?.full_name || 'Usuario',
        other_user_avatar: otherUser?.avatar_url || null,
        last_message: lastMessage?.content || 'Sin mensajes',
        last_message_time: lastMessage?.created_at || conv.created_at,
        unread_count: 0 // TODO: Implementar conteo de no leídos
      }
    }) || []

    return NextResponse.json({ 
      conversations: formattedConversations,
      success: true 
    })

  } catch (error) {
    console.error('Error in messages API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const senderId = authHeader.replace('Bearer ', '')
    const { property_id, receiver_id, content } = await request.json()

    if (!property_id || !receiver_id || !content) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Crear o encontrar conversación existente
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('property_id', property_id)
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${senderId})`)
      .single()

    if (convError && convError.code !== 'PGRST116') {
      console.error('Error finding conversation:', convError)
      return NextResponse.json({ error: 'Error al buscar conversación' }, { status: 500 })
    }

    // Si no existe conversación, crear una nueva
    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          property_id,
          sender_id: senderId,
          receiver_id
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating conversation:', createError)
        return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 })
      }

      conversation = newConv
    }

    // Crear mensaje
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: senderId,
        content
      })
      .select('*')
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
    }

    // Actualizar timestamp de conversación
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id)

    return NextResponse.json({ 
      message,
      conversation_id: conversation.id,
      success: true 
    })

  } catch (error) {
    console.error('Error in messages POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
