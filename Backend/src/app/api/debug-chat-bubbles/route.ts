// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener conversación de ejemplo (la más reciente del usuario)
    const { data: conversations, error: convError } = await supabase
      .from('community_conversations')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (convError || !conversations || conversations.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron conversaciones',
        details: convError 
      }, { status: 404 })
    }

    const conversationId = conversations[0].id

    // Obtener mensajes de esa conversación
    const { data: messages, error: msgError } = await supabase
      .from('community_messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        type,
        sender:sender_id (
          id,
          email,
          user_profiles (
            display_name,
            avatar_url
          )
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    if (msgError) {
      return NextResponse.json({ 
        error: 'Error al obtener mensajes',
        details: msgError 
      }, { status: 500 })
    }

    // Analizar cada mensaje
    const analysis = messages?.map((msg: any) => {
      const createdAt = new Date(msg.created_at)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)
      const diffInMinutes = Math.floor(diffInSeconds / 60)
      const diffInHours = Math.floor(diffInSeconds / 3600)
      const diffInDays = Math.floor(diffInSeconds / 86400)

      const senderData = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      const profileData = senderData?.user_profiles?.[0] || senderData?.user_profiles

      return {
        messageId: msg.id,
        content: msg.content.substring(0, 50),
        created_at: msg.created_at,
        created_at_parsed: createdAt.toISOString(),
        now: now.toISOString(),
        diffInSeconds,
        diffInMinutes,
        diffInHours,
        diffInDays,
        isFromCurrentUser: msg.sender_id === user.id,
        senderDisplayName: profileData?.display_name || 'Sin nombre',
        formatTimeAgoResult: formatTimeAgo(msg.created_at)
      }
    })

    return NextResponse.json({
      success: true,
      conversationId,
      currentUserId: user.id,
      messagesCount: messages?.length || 0,
      analysis
    })

  } catch (error: any) {
    console.error('Error en debug-chat-bubbles:', error)
    return NextResponse.json({ 
      error: 'Error interno',
      details: error.message 
    }, { status: 500 })
  }
}

// Función de formateo (copiada de ChatMessage.tsx)
function formatTimeAgo(date: string) {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'ahora'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
  return `${Math.floor(diffInSeconds / 2592000)}mes`
}
