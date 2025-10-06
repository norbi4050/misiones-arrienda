import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/comunidad/messages/unread-count
 * Returns unread messages count for authenticated user via RPC
 * Always returns 200 with { count: number } or { count: 0, error?: string }
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[unread-count] No authenticated user, returning count: 0')
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('get_unread_messages_count', { 
      p_uid: user.id 
    })

    if (error) {
      console.error('[unread-count] RPC error:', error)
      return NextResponse.json({ 
        count: 0, 
        error: error.message 
      }, { status: 200 })
    }

    const count = typeof data === 'number' ? data : 0
    console.log(`[unread-count] Success: ${count} unread messages for user ${user.id}`)
    
    return NextResponse.json({ count }, { status: 200 })

  } catch (e: any) {
    console.error('[unread-count] Unexpected error:', e)
    return NextResponse.json({ 
      count: 0, 
      error: e?.message ?? 'Unexpected error' 
    }, { status: 200 })
  }
}
