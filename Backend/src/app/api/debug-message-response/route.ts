import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId') || '60ecdcca-f9df-4511-bb43-9c54d064405e'

    // Obtener mensajes
    const { data: messages } = await supabase
      .from('Message')
      .select('*')
      .eq('conversationId', threadId)
      .order('createdAt', { ascending: false })
      .limit(5)

    const messageIds = (messages || []).map(m => m.id)
    
    // Obtener adjuntos
    const attachmentsMap = await getMessagesAttachments(messageIds)
    
    // Convertir Map a objeto para JSON
    const attachmentsObj: any = {}
    attachmentsMap.forEach((value, key) => {
      attachmentsObj[key] = value
    })

    return NextResponse.json({
      success: true,
      messages: messages || [],
      messageIds,
      attachmentsMap: attachmentsObj,
      attachmentsCount: attachmentsMap.size
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
