// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')

    if (!threadId) {
      return NextResponse.json({ error: 'threadId requerido' }, { status: 400 })
    }

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 [DEBUG] Investigando thread:', threadId)
    console.log('🔍 [DEBUG] Usuario actual:', user.id)

    // Llamar al endpoint individual del thread
    const response = await fetch(`${request.nextUrl.origin}/api/messages/threads/${threadId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    const data = await response.json()

    console.log('🔍 [DEBUG] Respuesta del API:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      debug: {
        threadId,
        currentUserId: user.id,
        apiResponse: data,
        apiStatus: response.status,
        hasThread: !!data.thread,
        hasOtherUser: !!data.thread?.otherUser,
        displayName: data.thread?.otherUser?.displayName,
        avatarUrl: data.thread?.otherUser?.avatarUrl,
        messagesCount: data.messages?.length || 0
      }
    })

  } catch (error: any) {
    console.error('🔍 [DEBUG] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
