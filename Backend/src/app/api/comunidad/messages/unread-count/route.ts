import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/comunidad/messages/unread-count - Obtener conteo de mensajes no leídos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('[UNREAD-COUNT] No session, returning 0')
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    let count = 0

    // ============================================
    // ESTRATEGIA 1: RPC (si existe)
    // ============================================
    try {
      console.log('[UNREAD-COUNT] Trying strategy 1: RPC')
      const { data, error } = await supabase.rpc('public.get_unread_messages_count', {
        p_uid: user.id
      })

      if (typeof data === 'number') {
        count = data
        console.log(`[UNREAD-COUNT] ✅ Strategy 1 success: ${count} unread messages`)
        return NextResponse.json({ count: Number(count) || 0 }, { status: 200 })
      } else {
        console.log('[UNREAD-COUNT] Strategy 1 failed (RPC not found or invalid data), trying strategy 2')
      }
    } catch (error) {
      console.log('[UNREAD-COUNT] Strategy 1 failed (RPC error), trying strategy 2')
    }

    // ============================================
    // ESTRATEGIA 2: Tabla messages clásica
    // ============================================
    try {
      console.log('[UNREAD-COUNT] Trying strategy 2: messages table')
      const { count: unreadCount, error } = await supabase
        .from('public.messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null)

      if (typeof unreadCount === 'number') {
        count = unreadCount
        console.log(`[UNREAD-COUNT] ✅ Strategy 2 success: ${count} unread messages`)
        return NextResponse.json({ count: Number(count) || 0 }, { status: 200 })
      } else {
        console.log('[UNREAD-COUNT] Strategy 2 failed (table/column issue), trying strategy 3')
      }
    } catch (error) {
      console.log('[UNREAD-COUNT] Strategy 2 failed (query error), trying strategy 3')
    }

    // ============================================
    // ESTRATEGIA 3: Tabla conversations con contadores por usuario
    // ============================================
    try {
      console.log('[UNREAD-COUNT] Trying strategy 3: conversations table with counters')
      const { data, error } = await supabase
        .rpc('sql', {
          query: `
            SELECT
              coalesce(sum(
                case when user1_id = $1 then unread_count_user1
                     when user2_id = $1 then unread_count_user2
                     else 0 end
              ),0) AS count
            FROM public.conversations
            WHERE $1 IN (user1_id, user2_id)
          `,
          params: [user.id]
        })

      if (data && data.length > 0 && typeof data[0].count === 'number') {
        count = data[0].count
        console.log(`[UNREAD-COUNT] ✅ Strategy 3 success: ${count} unread messages`)
        return NextResponse.json({ count: Number(count) || 0 }, { status: 200 })
      } else {
        console.log('[UNREAD-COUNT] Strategy 3 failed (table/columns not found)')
      }
    } catch (error) {
      console.log('[UNREAD-COUNT] Strategy 3 failed (query error)')
    }

    // ============================================
    // TODAS LAS ESTRATEGIAS FALLARON
    // ============================================
    console.error('[UNREAD-COUNT] ❌ All strategies failed, returning 0')
    return NextResponse.json({ count: 0 }, { status: 200 })

  } catch (error) {
    console.error('[UNREAD-COUNT] Unexpected error:', error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
