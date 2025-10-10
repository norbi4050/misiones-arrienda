import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const threadId = '60ecdcca-f9df-4511-bb43-9c54d064405e'
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener mensajes
    const { data: messages, error: messagesError } = await supabase
      .from('Message')
      .select('id, senderId, body, createdAt, isRead')
      .eq('conversationId', threadId)
      .order('createdAt', { ascending: true })
      .limit(30)

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 })
    }

    console.log('[DEBUG] Total messages:', messages?.length)

    // Obtener adjuntos
    const messageIds = (messages || []).map(m => m.id)
    console.log('[DEBUG] Message IDs:', messageIds)
    
    const attachmentsMap = await getMessagesAttachments(messageIds)
    console.log('[DEBUG] Attachments map size:', attachmentsMap.size)
    console.log('[DEBUG] Attachments map:', Array.from(attachmentsMap.entries()))

    // Formatear mensajes con attachments
    const messagesWithAttachments = (messages || []).map(msg => {
      const attachments = attachmentsMap.get(msg.id) || []
      console.log(`[DEBUG] Message ${msg.id} has ${attachments.length} attachments`)
      
      return {
        id: msg.id,
        content: msg.body,
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        attachments
      }
    })

    return NextResponse.json({
      success: true,
      totalMessages: messagesWithAttachments.length,
      messagesWithAttachments: messagesWithAttachments.map(m => ({
        id: m.id,
        hasAttachments: m.attachments.length > 0,
        attachmentsCount: m.attachments.length,
        attachments: m.attachments
      })),
      fullResponse: {
        messages: messagesWithAttachments
      }
    })

  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
