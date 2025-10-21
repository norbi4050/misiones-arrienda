/**
 * API Endpoint: Contador de notificaciones no leídas
 *
 * GET /api/notifications/unread-count
 *
 * Retorna el número de notificaciones no leídas del usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
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

    // Obtener contador de no leídas
    const count = await notificationService.getUnreadCount(user.id)

    return NextResponse.json({
      success: true,
      count,
    })

  } catch (error) {
    console.error('[Unread Count API] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
