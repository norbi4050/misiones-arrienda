import { NextResponse, NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ updated: 0, error: 'no-session' })
    }

    // Parse request body
    let body: { conversationId?: string } = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ updated: 0, error: 'invalid-json' })
    }

    if (!body.conversationId) {
      return NextResponse.json({ updated: 0, error: 'missing-conversationId' })
    }

    // Mark messages as read
    // Only update messages where:
    // - conversation_id matches
    // - sender_id is NOT the current user (don't mark own messages as read)
    // - read_at is null (not already read)
    const { data, error } = await supabase
      .from('community_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', body.conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null)
      .select('id')

    if (error) {
      console.error('[comunidad/messages/read] update error', error)
      return NextResponse.json({ updated: 0, error: error.message })
    }

    const updated = data?.length ?? 0
    console.log(`[comunidad/messages/read] Marked ${updated} messages as read for conversation ${body.conversationId}`)

    return NextResponse.json({ updated })
  } catch (e: any) {
    console.error('[comunidad/messages/read] unexpected error', e)
    return NextResponse.json({ updated: 0, error: e?.message ?? 'unexpected' })
  }
}
