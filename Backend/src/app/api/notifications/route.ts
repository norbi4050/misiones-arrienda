/**
 * API Endpoint: Notificaciones
 *
 * GET /api/notifications - Listar notificaciones del usuario autenticado
 *
 * Query params:
 * - unreadOnly: boolean - Solo no leídas (default: false)
 * - limit: number - Cantidad máxima (default: 20, max: 100)
 * - offset: number - Para paginación (default: 0)
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

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener notificaciones
    const result = await notificationService.getNotifications(user.id, {
      unreadOnly,
      limit,
      offset,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Parsear JSON de metadata y channels
    const notifications = result.data?.map(notification => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      channels: notification.channels ? JSON.parse(notification.channels) : [],
    })) || []

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      hasMore: notifications.length === limit,
    })

  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
