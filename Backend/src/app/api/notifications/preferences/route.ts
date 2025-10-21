/**
 * API Endpoint: Preferencias de notificación
 *
 * GET /api/notifications/preferences - Obtener preferencias del usuario
 * PUT /api/notifications/preferences - Actualizar preferencias del usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificationService, NotificationPreferences } from '@/lib/notification-service'
import { z } from 'zod'

// Schema de validación para actualización de preferencias
const updatePreferencesSchema = z.object({
  // Canales globales
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),

  // Por tipo de evento
  newMessages: z.boolean().optional(),
  messageReplies: z.boolean().optional(),
  propertyInquiries: z.boolean().optional(),
  propertyStatusChange: z.boolean().optional(),
  propertyExpiring: z.boolean().optional(),
  favoritesUpdates: z.boolean().optional(),
  newPropertiesInArea: z.boolean().optional(),
  likesReceived: z.boolean().optional(),
  newFollowers: z.boolean().optional(),
  paymentCompleted: z.boolean().optional(),
  planExpiring: z.boolean().optional(),
  invoiceReady: z.boolean().optional(),
  systemAnnouncements: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  promotionalEmails: z.boolean().optional(),
  newsletter: z.boolean().optional(),
})

/**
 * GET - Obtener preferencias
 */
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

    // Obtener preferencias
    const preferences = await notificationService.getPreferences(user.id)

    return NextResponse.json({
      success: true,
      preferences,
    })

  } catch (error) {
    console.error('[Preferences API GET] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Actualizar preferencias
 */
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

    // Validar datos de entrada
    const body = await request.json()
    const validation = updatePreferencesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    // Actualizar preferencias
    const result = await notificationService.updatePreferences(
      user.id,
      validation.data
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al actualizar preferencias' },
        { status: 500 }
      )
    }

    // Obtener preferencias actualizadas
    const updatedPreferences = await notificationService.getPreferences(user.id)

    return NextResponse.json({
      success: true,
      message: 'Preferencias actualizadas correctamente',
      preferences: updatedPreferences,
    })

  } catch (error) {
    console.error('[Preferences API PUT] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
