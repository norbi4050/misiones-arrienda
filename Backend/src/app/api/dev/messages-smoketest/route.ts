import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Helper para detectar "columna no existe"
function isMissingColumn(err?: { message?: string }) {
  return !!err?.message && /column .* does not exist|42703|PGRST204/i.test(err.message)
}

// Helper para mapear userId → profileId
async function ensureProfileId(userId: string): Promise<string> {
  // 1) Buscar perfil por user_id
  const sel = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!sel.error && sel.data?.id) return sel.data.id

  // 2) Si no existe, crear perfil mínimo y devolver su id
  const ins = await supabaseAdmin
    .from('user_profiles')
    .insert({
      user_id: userId,
      role: 'BUSCO',
      city: 'SIN_CIUDAD',
      budget_min: 0,
      budget_max: 0,
      photos: []
    })
    .select('id')
    .single()

  if (ins.error) {
    throw Object.assign(new Error(ins.error.message), { step: 'provision_profile' })
  }
  return ins.data.id
}

export async function GET(req: NextRequest) {
  try {
    // Bloquear en producción - solo DEV
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Sonda rápida para verificar service key
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 30
    if (!hasServiceKey) {
      return NextResponse.json({ 
        success: false, 
        step: 'env_service', 
        error: 'Missing SUPABASE_SERVICE_ROLE_KEY' 
      }, { status: 500 })
    }

    // Verificar variables de entorno requeridas
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DEV_SMOKETEST_SECRET',
    ] as const
    
    for (const k of required) {
      if (!process.env[k]) {
        return NextResponse.json({ 
          success: false, 
          step: 'env', 
          error: `Missing env var ${k}` 
        }, { status: 500 })
      }
    }

    // Obtener parámetros de query
    const url = new URL(req.url)
    const user = url.searchParams.get('user')
    const peer = url.searchParams.get('peer')
    const secret = url.searchParams.get('secret')

    // Validar secret
    if (!secret || secret !== process.env.DEV_SMOKETEST_SECRET) {
      return NextResponse.json({ 
        success: false, 
        step: 'env', 
        error: 'Invalid secret' 
      }, { status: 403 })
    }

    // Validar user y peer
    if (!user || !peer) {
      return NextResponse.json({ 
        success: false, 
        step: 'env', 
        error: 'Missing user|peer' 
      }, { status: 400 })
    }

    // Mapear userId → profileId
    const profileA = await ensureProfileId(user)
    const profileB = await ensureProfileId(peer)

    // Normalizar par (evitar duplicados)
    const low = profileA < profileB ? profileA : profileB
    const high = profileA < profileB ? profileB : profileA

    // Probes para detectar esquema
    async function probeAB(profileA: string, profileB: string) {
      try {
        const res = await supabaseAdmin
          .from('conversations')
          .select('id')
        .or(`and(a_id.eq.${profileA},b_id.eq.${profileB}),and(a_id.eq.${profileB},b_id.eq.${profileA})`)
          .limit(1)
        if (res.error) {
          if (isMissingColumn(res.error)) return { ok: false, reason: 'missing' }
          throw res.error
        }
        return { ok: true, data: res.data, schema: 'ab' as const }
      } catch (err: any) {
        if (isMissingColumn(err)) return { ok: false, reason: 'missing' }
        throw err
      }
    }

    async function probeUser12(profileA: string, profileB: string) {
      try {
        const res = await supabaseAdmin
          .from('conversations')
          .select('id')
        .or(`and(user1_id.eq.${profileA},user2_id.eq.${profileB}),and(user1_id.eq.${profileB},user2_id.eq.${profileA})`)
          .limit(1)
        if (res.error) {
          if (isMissingColumn(res.error)) return { ok: false, reason: 'missing' }
          throw res.error
        }
        return { ok: true, data: res.data, schema: 'user12' as const }
      } catch (err: any) {
        if (isMissingColumn(err)) return { ok: false, reason: 'missing' }
        throw err
      }
    }

    async function probeSR(profileA: string, profileB: string) {
      try {
        const res = await supabaseAdmin
          .from('conversations')
          .select('id')
        .or(`and(sender_id.eq.${profileA},receiver_id.eq.${profileB}),and(sender_id.eq.${profileB},receiver_id.eq.${profileA})`)
          .limit(1)
        if (res.error) {
          if (isMissingColumn(res.error)) return { ok: false, reason: 'missing' }
          throw res.error
        }
        return { ok: true, data: res.data, schema: 'sr' as const }
      } catch (err: any) {
        if (isMissingColumn(err)) return { ok: false, reason: 'missing' }
        throw err
      }
    }

    async function probeUserAB(profileA: string, profileB: string) {
      try {
        const res = await supabaseAdmin
          .from('conversations')
          .select('id')
        .or(`and(user_a_id.eq.${profileA},user_b_id.eq.${profileB}),and(user_a_id.eq.${profileB},user_b_id.eq.${profileA})`)
          .limit(1)
        if (res.error) {
          if (isMissingColumn(res.error)) return { ok: false, reason: 'missing' }
          throw res.error
        }
        return { ok: true, data: res.data, schema: 'userab' as const }
      } catch (err: any) {
        if (isMissingColumn(err)) return { ok: false, reason: 'missing' }
        throw err
      }
    }

    async function probeParticipants() {
      try {
        const test = await supabaseAdmin.from('conversation_participants').select('conversation_id').limit(1)
        if (test.error && /relation .* does not exist|42P01/.test(test.error.message)) {
          return { ok: false, reason: 'missing' }
        }
        if (test.error) throw test.error
        return { ok: true, schema: 'participants' as const }
      } catch (err: any) {
        if (/relation .* does not exist|42P01/.test(err.message)) {
          return { ok: false, reason: 'missing' }
        }
        throw err
      }
    }

    // Detección de esquema por PROBES secuenciales
    let schema: 'ab' | 'user12' | 'sr' | 'userab' | 'participants' | undefined
    let existingConvId: string | undefined

    try {
      // Probe 1: ab (a_id/b_id)
      const probeABResult = await probeAB(profileA, profileB)
      if (probeABResult.ok) {
        schema = probeABResult.schema
        existingConvId = probeABResult.data?.[0]?.id
      } else {
        // Probe 2: user12 (user1_id/user2_id)
        const probeUser12Result = await probeUser12(profileA, profileB)
        if (probeUser12Result.ok) {
          schema = probeUser12Result.schema
          existingConvId = probeUser12Result.data?.[0]?.id
        } else {
          // Probe 3: sr (sender_id/receiver_id)
          const probeSRResult = await probeSR(profileA, profileB)
          if (probeSRResult.ok) {
            schema = probeSRResult.schema
            existingConvId = probeSRResult.data?.[0]?.id
          } else {
            // Probe 4: userab (user_a_id/user_b_id)
            const probeUserABResult = await probeUserAB(profileA, profileB)
            if (probeUserABResult.ok) {
              schema = probeUserABResult.schema
              existingConvId = probeUserABResult.data?.[0]?.id
            } else {
              // Probe 5: participants (fallback)
              const probeParticipantsResult = await probeParticipants()
              if (probeParticipantsResult.ok) {
                schema = probeParticipantsResult.schema
                // Para participants, buscar conversación existente
                const existingConv = await supabaseAdmin
                  .from('conversation_participants')
                  .select('conversation_id')
                  .in('user_id', [profileA, profileB])
                
                if (existingConv.data) {
                  const convCounts = existingConv.data.reduce((acc, row) => {
                    acc[row.conversation_id] = (acc[row.conversation_id] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  
                  existingConvId = Object.keys(convCounts).find(id => convCounts[id] === 2)
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.message?.includes('permission denied')) {
        return NextResponse.json({ 
          success: false, 
          step: 'perm', 
          error: err.message,
          code: err.code || null,
          details: err.details || null,
          hint: err.hint || null
        }, { status: 403 })
      }
      if (err.message?.includes('violates row-level security')) {
        return NextResponse.json({ 
          success: false, 
          step: 'rls', 
          error: err.message,
          code: err.code || null,
          details: err.details || null,
          hint: err.hint || null
        }, { status: 403 })
      }
      return NextResponse.json({ 
        success: false, 
        step: 'find_conversation', 
        error: err?.message || 'Failed to probe schema',
        code: err.code || null,
        details: err.details || null,
        hint: err.hint || null
      }, { status: 500 })
    }

    if (!schema) {
      return NextResponse.json({ 
        success: false, 
        step: 'find_conversation_schema', 
        error: 'Unsupported schema: no known column pairs' 
      }, { status: 500 })
    }

    // Crear conversación si no existe
    let convId = existingConvId

    if (!convId) {
      try {
        let newConv
        switch (schema) {
          case 'ab':
            newConv = await supabaseAdmin
              .from('conversations')
              .insert({ a_id: low, b_id: high })
              .select('id')
              .single()
            break
          case 'user12':
            newConv = await supabaseAdmin
              .from('conversations')
              .insert({ user1_id: low, user2_id: high })
              .select('id')
              .single()
            break
          case 'sr':
            newConv = await supabaseAdmin
              .from('conversations')
              .insert({ sender_id: low, receiver_id: high })
              .select('id')
              .single()
            break
          case 'userab':
            newConv = await supabaseAdmin
              .from('conversations')
              .insert({ user_a_id: low, user_b_id: high })
              .select('id')
              .single()
            break
          case 'participants':
            // Crear conversación vacía
            newConv = await supabaseAdmin
              .from('conversations')
              .insert({})
              .select('id')
              .single()
            if (newConv.data) {
              // Insertar participantes
              const participantsResult = await supabaseAdmin
                .from('conversation_participants')
                .insert([
                  { conversation_id: newConv.data.id, user_id: profileA },
                  { conversation_id: newConv.data.id, user_id: profileB }
                ])
              if (participantsResult.error) throw participantsResult.error
            }
            break
        }
        
        if (newConv?.error) {
          if (newConv.error.message?.includes('permission denied')) {
            return NextResponse.json({ 
              success: false, 
              step: 'perm', 
              error: newConv.error.message,
              code: newConv.error.code || null,
              details: newConv.error.details || null,
              hint: newConv.error.hint || null
            }, { status: 403 })
          }
          if (newConv.error.message?.includes('violates row-level security')) {
            return NextResponse.json({ 
              success: false, 
              step: 'rls', 
              error: newConv.error.message,
              code: newConv.error.code || null,
              details: newConv.error.details || null,
              hint: newConv.error.hint || null
            }, { status: 403 })
          }
          return NextResponse.json({ 
            success: false, 
            step: 'upsert_conversation', 
            error: newConv.error.message,
            code: newConv.error.code || null,
            details: newConv.error.details || null,
            hint: newConv.error.hint || null
          }, { status: 500 })
        }
        convId = newConv?.data?.id
      } catch (err: any) {
        return NextResponse.json({ 
          success: false, 
          step: 'upsert_conversation', 
          error: err?.message || 'Failed to create conversation',
          code: err.code || null,
          details: err.details || null,
          hint: err.hint || null
        }, { status: 500 })
      }
    }

    if (!convId) {
      return NextResponse.json({ 
        success: false, 
        step: 'upsert_conversation', 
        error: 'No conversation ID obtained' 
      }, { status: 500 })
    }

    // 1) INSERT mensaje (ajustado al esquema real)
    const insMsg = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: String(convId), // asegurar string
        sender_id: String(profileA),     // usar profile ID del emisor
        body: '[SMOKETEST] hello'
      })
      .select('id, body, created_at')
      .single()

    if (insMsg.error) {
      return NextResponse.json({
        success: false,
        step: 'insert_message',
        error: insMsg.error.message,
        code: insMsg.error.code || null,
        details: insMsg.error.details || null,
        hint: insMsg.error.hint || null
      }, { status: 500 })
    }

    // 2) (best-effort) actualizar metadatos de conversación si existen esas columnas
    try {
      await supabaseAdmin
        .from('conversations')
        .update({
          last_message_id: insMsg.data.id,
          last_message_at: new Date().toISOString()
        })
        .eq('id', convId)
    } catch { 
      /* ignorar si columnas no existen */ 
    }

    // 3) Conteo de no leídos para el peer (usa is_read)
    let unread_for_peer: number | null = null
    const cnt = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .eq('is_read', false)
      .neq('sender_id', String(profileB)) // no leídos del punto de vista de profileB

    if (!cnt.error && typeof cnt.count === 'number') {
      unread_for_peer = cnt.count
    }

    // 4) Respuesta OK
    return NextResponse.json({
      success: true,
      conversation_id: String(convId),
      last_message: {
        id: insMsg.data.id,
        body: insMsg.data.body
      },
      unread_for_peer,
      schema_used: schema, // el que ya detectaste para conversations
      ts: Date.now()
    })

  } catch (err: any) {
    if (err.message?.includes('permission denied')) {
      return NextResponse.json({ 
        success: false, 
        step: 'perm', 
        error: err.message,
        code: err.code || null,
        details: err.details || null,
        hint: err.hint || null
      }, { status: 403 })
    }
    if (err.message?.includes('violates row-level security')) {
      return NextResponse.json({ 
        success: false, 
        step: 'rls', 
        error: err.message,
        code: err.code || null,
        details: err.details || null,
        hint: err.hint || null
      }, { status: 403 })
    }
    return NextResponse.json({ 
      success: false, 
      step: 'unknown', 
      error: err?.message || 'Unknown error',
      code: err.code || null,
      details: err.details || null,
      hint: err.hint || null
    }, { status: 500 })
  }
}
