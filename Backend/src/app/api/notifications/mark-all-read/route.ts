/**
 * API Endpoint: Marcar todas las notificaciones como leídas
 *
 * PUT /api/notifications/mark-all-read
 *
 * Marca todas las notificaciones del usuario autenticado como leídas
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Marcar todas como leídas
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('read', false)

    if (updateError) {
      console.error('[Mark All Read API] Error:', updateError)
      return NextResponse.json(
        { error: 'Error al marcar notificaciones como leídas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
    })

  } catch (error) {
    console.error('[Mark All Read API] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
