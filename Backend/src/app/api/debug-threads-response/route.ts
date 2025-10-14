import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Llamar al endpoint real de threads
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages/threads`, {
      headers: {
        'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      rawResponse: data,
      analysis: {
        threadsCount: data.threads?.length || 0,
        firstThread: data.threads?.[0] || null,
        avatarUrls: data.threads?.map((t: any) => ({
          threadId: t.threadId,
          displayName: t.otherUser?.displayName,
          avatarUrl: t.otherUser?.avatarUrl,
          hasAvatar: !!t.otherUser?.avatarUrl
        })) || []
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal error', 
      details: error.message 
    }, { status: 500 })
  }
}
