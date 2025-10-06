import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/comunidad/messages/unread-count - Obtener conteo de mensajes no leídos
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

    // Obtener conversaciones del usuario y sumar mensajes no leídos
    const { data: conversations, error: conversationsError } = await supabase
      .from('community_conversations')
      .select('unread_count_user1, unread_count_user2, user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (conversationsError) {
      console.error('Error fetching unread count:', conversationsError)
      return NextResponse.json(
        { error: 'Error al obtener conteo de mensajes no leídos' },
        { status: 500 }
      )
    }

    // Sumar mensajes no leídos según si el usuario es user1 o user2
    const totalUnread = conversations?.reduce((sum, conv) => {
      const isUser1 = conv.user1_id === user.id
      const unreadCount = isUser1 ? conv.unread_count_user1 : conv.unread_count_user2
      return sum + (unreadCount || 0)
    }, 0) || 0

    return NextResponse.json({
      count: totalUnread
    })

  } catch (error) {
    console.error('Error in unread-count GET:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
