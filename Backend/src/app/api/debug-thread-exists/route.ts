import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId') || '60ecdcca-f9df-4511-bb43-9c54d064405e'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[DEBUG] Buscando thread:', threadId)

    // Buscar en message_threads
    const { data: messageThread, error: mtError } = await supabase
      .from('message_threads')
      .select('*')
      .eq('id', threadId)
      .single()

    // Buscar en conversations
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', threadId)
      .single()

    // Buscar mensajes relacionados
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', threadId)
      .limit(5)

    return NextResponse.json({
      threadId,
      found: {
        inConversations: !!conversation,
        hasMessages: messages && messages.length > 0
      },
      data: {
        conversation: conversation || null,
        messagesCount: messages?.length || 0,
        sampleMessages: messages || []
      },
      errors: {
        conversationError: convError?.message || null,
        messagesError: msgError?.message || null
      },
      note: "La tabla conversations tiene AMBOS sistemas: participant_1/participant_2 (propiedades) y a_id/b_id (comunidad)"
    })

  } catch (error) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
