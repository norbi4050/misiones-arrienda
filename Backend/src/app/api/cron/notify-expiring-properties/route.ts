/**
 * Cron Job: Notificar Propiedades Próximas a Expirar
 *
 * Este endpoint se ejecuta diariamente para:
 * - Detectar propiedades que expiran en 7 días
 * - Enviar notificaciones a los dueños
 *
 * Configurado en vercel.json:
 * - Frecuencia: Diaria a las 8:00 AM
 * - URL: /api/cron/notify-expiring-properties
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notification-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización (CRON_SECRET en variables de entorno)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Checking expiring properties...')

    const supabase = createClient()

    // Calcular fecha de dentro de 7 días
    const in7Days = new Date()
    in7Days.setDate(in7Days.getDate() + 7)
    in7Days.setHours(0, 0, 0, 0) // Inicio del día

    const in7DaysEnd = new Date(in7Days)
    in7DaysEnd.setHours(23, 59, 59, 999) // Fin del día

    // Buscar propiedades activas que expiran en exactamente 7 días
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, title, user_id, expires_at, operation_type, city')
      .eq('status', 'PUBLISHED')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .gte('expires_at', in7Days.toISOString())
      .lte('expires_at', in7DaysEnd.toISOString())

    if (error) {
      console.error('[CRON] Error fetching expiring properties:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!properties || properties.length === 0) {
      console.log('[CRON] No expiring properties found')
      return NextResponse.json({
        success: true,
        message: 'No expiring properties found',
        checked: 0,
        notified: 0
      })
    }

    console.log(`[CRON] Found ${properties.length} properties expiring in 7 days`)

    let notificationsSent = 0
    const errors: string[] = []

    // Procesar cada propiedad
    for (const property of properties) {
      try {
        const expirationDate = new Date(property.expires_at!)

        await sendNotification({
          userId: property.user_id,
          type: 'PROPERTY_EXPIRING',
          title: `Tu propiedad "${property.title}" expira en 7 días`,
          message: `Tu publicación de ${property.operation_type} en ${property.city} expirará el ${expirationDate.toLocaleDateString('es-AR')}. Renovála para mantenerla activa.`,
          channels: ['email', 'in_app'],
          metadata: {
            propertyId: property.id,
            propertyTitle: property.title,
            expirationDate: property.expires_at,
            daysRemaining: 7,
            city: property.city,
            operationType: property.operation_type,
            ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/publicaciones/${property.id}`,
            ctaText: 'Renovar publicación'
          },
          relatedId: property.id,
          relatedType: 'property_expiration'
        })

        notificationsSent++
        console.log(`[CRON] Notification sent for property ${property.id}`)

      } catch (err) {
        const errorMsg = `Failed to notify property ${property.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        console.error(`[CRON] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${properties.length} expiring properties, sent ${notificationsSent} notifications`,
      checked: properties.length,
      notified: notificationsSent,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('[CRON] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
