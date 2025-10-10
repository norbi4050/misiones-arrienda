import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 1. Verificar tabla MessageAttachment
    const { data: attachments, error: attError } = await supabase
      .from('MessageAttachment')
      .select('*')
      .limit(5)
    
    // 2. Verificar mensajes recientes
    const { data: messages, error: msgError } = await supabase
      .from('Message')
      .select('id, body, createdAt')
      .order('createdAt', { ascending: false })
      .limit(5)
    
    return NextResponse.json({
      success: true,
      debug: {
        attachments: {
          count: attachments?.length || 0,
          data: attachments,
          error: attError?.message
        },
        messages: {
          count: messages?.length || 0,
          data: messages,
          error: msgError?.message
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
