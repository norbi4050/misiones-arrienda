import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId') || '60ecdcca-f9df-4511-bb43-9c54d064405e'
    
    const supabase = createClient()
    
    // 1. Obtener mensajes
    const { data: messages, error: messagesError } = await supabase
      .from('Message')
      .select('id, body, senderId, createdAt')
      .eq('conversationId', threadId)
      .order('createdAt', { ascending: true })
      .limit(5)
    
    if (messagesError) {
      return NextResponse.json({ error: messagesError }, { status: 500 })
    }
    
    // 2. Obtener attachments
    const messageIds = (messages || []).map(m => m.id)
    const attachmentsMap = await getMessagesAttachments(messageIds)
    
    // 3. Construir respuesta como lo hace el endpoint real
    const messagesWithAttachments = (messages || []).map(msg => ({
      id: msg.id,
      content: msg.body,
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      attachments: attachmentsMap.get(msg.id) || []
    }))
    
    return NextResponse.json({
      threadId,
      totalMessages: messages?.length || 0,
      attachmentsMapSize: attachmentsMap.size,
      attachmentsMapEntries: Array.from(attachmentsMap.entries()).map(([id, atts]) => ({
        messageId: id,
        count: atts.length,
        attachments: atts
      })),
      messagesWithAttachments,
      rawMessages: messages
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
