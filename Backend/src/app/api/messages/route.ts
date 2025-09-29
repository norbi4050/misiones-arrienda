import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const supabase = getSupabase(req)

    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, is_read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code ?? null }, { status: 500 })
    }

    return NextResponse.json({ messages: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unhandled' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase(req)
    const body = await req.json().catch(() => ({}))
    const { conversationId, text }:{ conversationId?: string, text?: string } = body || {}
    if (!conversationId || !text) {
      return NextResponse.json({ error: 'conversationId and text are required' }, { status: 400 })
    }

    // 1) Obtener el usuario autenticado
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const authUserId = auth.user.id // uuid

    // 2) Resolver profileId del emisor (user_profiles.id) via RLS (select permitido)
    const { data: prof, error: profErr } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', authUserId) // user_profiles.user_id es text, Supabase castea uuid->text
      .maybeSingle()

    if (profErr || !prof?.id) {
      return NextResponse.json({ error: 'Profile not found for current user' }, { status: 403 })
    }

    // 3) Insertar mensaje (RLS validará que el usuario pertenece a la conversación)
    const { data: inserted, error: insErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: String(conversationId),
        sender_id: String(prof.id),
        body: String(text),
      })
      .select('id, body, created_at')
      .single()

    if (insErr) {
      return NextResponse.json({ error: insErr.message, code: insErr.code ?? null }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unhandled' }, { status: 500 })
  }
}
