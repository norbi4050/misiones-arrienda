import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  })
}

// PROMPT 2: Detectar esquema
async function detectSchema(supabase: any): Promise<'PRISMA' | 'SUPABASE' | null> {
  try {
    const { error: prismaError } = await supabase
      .from('Conversation')
      .select('id')
      .limit(1)
    if (!prismaError) return 'PRISMA'
  } catch {}

  try {
    const { error: supabaseError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)
    if (!supabaseError) return 'SUPABASE'
  } catch {}

  return null
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    
    // PROMPT 1: Aceptar ambos nombres (threadId prioritario, conversationId legacy)
    const threadId = searchParams.get('threadId') || searchParams.get('conversationId')
    
    // PROMPT 6: Log RAW QUERY
    console.log('[RAW QUERY]', { threadId_param: searchParams.get('threadId'), conversationId_param: searchParams.get('conversationId') })
    
    // PROMPT F: Validación silenciosa - devolver 200 con warning en lugar de 400
    if (!threadId) {
      console.log('[MESSAGES/API] ⚠️ called without threadId')
      return NextResponse.json({ 
        threadId: null,
        messages: [],
        _meta: {
          warning: 'NO_THREAD_ID',
          message: 'No se proporcionó threadId, devolviendo lista vacía'
        }
      }, { status: 200 })
    }

    const supabase = getSupabase(req)

    // PROMPT 3: Auth consistente
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      console.log('[AUTH] ❌ No autorizado')
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const userId = auth.user.id
    console.log('[RESOLVED PARAMS]', { threadId, userId })

    // PROMPT 2 & 3: Detectar esquema y verificar ownership
    const schema = await detectSchema(supabase)
    console.log('[SCHEMA BRANCH]', schema)

    if (!schema) {
      return NextResponse.json({ 
        error: 'DB_ERROR',
        details: 'No se encontró tabla de conversaciones válida'
      }, { status: 500 })
    }

    // PROMPT 3: Verificar que el usuario es participante del hilo
    let isParticipant = false
    let userProfileId: string | null = null

    if (schema === 'PRISMA') {
      // Obtener UserProfile del usuario
      const { data: userProfile } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', userId)
        .single()

      if (userProfile) {
        userProfileId = userProfile.id
        
        // Verificar si es participante (aId o bId)
        const { data: conversation } = await supabase
          .from('Conversation')
          .select('id')
          .eq('id', threadId)
          .or(`aId.eq.${userProfile.id},bId.eq.${userProfile.id}`)
          .single()

        isParticipant = !!conversation
      }
    } else if (schema === 'SUPABASE') {
      // Verificar si es participante (sender_id o receiver_id)
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', threadId)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .single()

      isParticipant = !!conversation
    }

    if (!isParticipant) {
      console.log('[OWNERSHIP] ❌ Usuario no es participante del hilo')
      return NextResponse.json({ 
        error: 'FORBIDDEN',
        details: 'No tienes acceso a este hilo'
      }, { status: 403 })
    }

    console.log('[OWNERSHIP] ✅ Usuario es participante')

    // Obtener mensajes
    const messagesTable = schema === 'PRISMA' ? 'Message' : 'messages'
    const conversationIdField = schema === 'PRISMA' ? 'conversationId' : 'conversation_id'
    const senderIdField = schema === 'PRISMA' ? 'senderId' : 'sender_id'
    const bodyField = 'body'
    const isReadField = schema === 'PRISMA' ? 'isRead' : 'is_read'
    const createdAtField = schema === 'PRISMA' ? 'createdAt' : 'created_at'

    const { data, error } = await supabase
      .from(messagesTable)
      .select(`id, ${conversationIdField}, ${senderIdField}, ${bodyField}, ${isReadField}, ${createdAtField}`)
      .eq(conversationIdField, threadId)
      .order(createdAtField, { ascending: true })

    if (error) {
      console.error('[DB] ❌ Error al obtener mensajes:', error)
      return NextResponse.json({ 
        error: 'DB_ERROR',
        details: error.message 
      }, { status: 500 })
    }

    // PROMPT 5: Formato uniforme con isMine
    const messages = (data ?? []).map((msg: any) => ({
      id: msg.id,
      content: msg[bodyField],
      createdAt: msg[createdAtField],
      senderId: msg[senderIdField],
      isMine: schema === 'PRISMA' 
        ? msg[senderIdField] === userProfileId
        : msg[senderIdField] === userId,
      isRead: msg[isReadField]
    }))

    const duration = Date.now() - startTime
    console.log(`[MESSAGES GET] ✅ ${messages.length} mensajes en ${duration}ms, rama: ${schema}`)

    // PROMPT 1 & 5: Responder con formato unificado
    return NextResponse.json({ 
      threadId,
      messages,
      _meta: {
        schema,
        count: messages.length,
        duration_ms: duration
      }
    })
  } catch (err: any) {
    console.error('[MESSAGES GET] ❌ Error:', err)
    return NextResponse.json({ error: err?.message ?? 'Unhandled' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase(req)
    const body = await req.json().catch(() => ({}))
    
    // PROMPT 1: Aceptar ambos nombres (threadId prioritario, conversationId legacy)
    const threadId = body.threadId || body.conversationId
    const text = body.text
    
    if (!threadId || !text) {
      return NextResponse.json({ 
        error: 'VALIDATION_ERROR',
        issues: [
          ...(!threadId ? [{ path: 'threadId', message: 'threadId is required' }] : []),
          ...(!text ? [{ path: 'text', message: 'text is required' }] : [])
        ]
      }, { status: 400 })
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
        conversation_id: String(threadId),
        sender_id: String(prof.id),
        body: String(text),
      })
      .select('id, body, created_at')
      .single()

    if (insErr) {
      return NextResponse.json({ error: insErr.message, code: insErr.code ?? null }, { status: 500 })
    }

    // PROMPT A: Write-through de metadatos de conversación (best-effort)
    try {
      const now = new Date().toISOString()
      const { error: updateErr } = await supabase
        .from('conversations')
        .update({
          last_message_text: String(text),
          last_message_at: inserted.created_at || now,
          updated_at: now
        })
        .eq('id', String(threadId))

      if (updateErr) {
        console.error('[Messages] ⚠️ Failed to update conversation metadata:', updateErr.message)
        // No romper la respuesta, solo log
      } else {
        console.log('[Messages] ✅ Conversation metadata updated:', threadId)
      }
    } catch (metaErr: any) {
      console.error('[Messages] ⚠️ Exception updating conversation metadata:', metaErr.message)
      // No romper la respuesta, solo log
    }

    // PROMPT 1: Responder siempre con threadId (nombre oficial)
    return NextResponse.json({ 
      ok: true, 
      threadId,
      message: inserted 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unhandled' }, { status: 500 })
  }
}
