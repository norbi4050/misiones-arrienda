import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  })
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase(req)
    const { conversationId } = await req.json().catch(() => ({}))
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    // auth user
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const authUserId = auth.user.id

    // mi profileId
    const { data: prof, error: profErr } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle()

    if (profErr || !prof?.id) {
      return NextResponse.json({ error: 'Profile not found for current user' }, { status: 403 })
    }

    // marcar como leídos (RLS debe permitir update si soy participante)
    const { error: updErr } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', String(prof.id))
      .eq('is_read', false)

    if (updErr) {
      return NextResponse.json({ error: updErr.message, code: updErr.code ?? null }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unhandled' }, { status: 500 })
  }
}
