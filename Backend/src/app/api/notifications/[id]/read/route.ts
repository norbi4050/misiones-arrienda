/**
 * API Endpoint: Marcar notificación como leída
 *
 * PUT /api/notifications/[id]/read
 *
 * Marca una notificación específica como leída
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificationService } from '@/lib/notification-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const notificationId = params.id

    // Verificar que la notificación pertenece al usuario
    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single()

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado para modificar esta notificación' },
        { status: 403 }
      )
    }

    // Marcar como leída
    const result = await notificationService.markAsRead(notificationId)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error al marcar como leída' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
    })

  } catch (error) {
    console.error('[Mark Read API] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
