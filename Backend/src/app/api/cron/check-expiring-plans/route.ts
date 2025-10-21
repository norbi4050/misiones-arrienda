/**
 * Cron Job: Verificar Planes Próximos a Expirar
 *
 * Este endpoint debe ejecutarse diariamente para:
 * - Detectar planes que expiran en 7, 3, o 1 días
 * - Enviar notificaciones a las inmobiliarias
 *
 * Configurar en Vercel Cron o similar:
 * - Frecuencia: Diaria a las 9:00 AM
 * - URL: /api/cron/check-expiring-plans
 * - Header: Authorization: Bearer <CRON_SECRET>
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

    console.log('[CRON] Checking expiring plans...')

    const supabase = createClient()

    // Obtener inmobiliarias con planes que expiran en 7, 3, o 1 días
    const today = new Date()
    const in7Days = new Date(today)
    in7Days.setDate(in7Days.getDate() + 7)
    const in3Days = new Date(today)
    in3Days.setDate(in3Days.getDate() + 3)
    const in1Day = new Date(today)
    in1Day.setDate(in1Day.getDate() + 1)

    // Obtener usuarios con planes próximos a expirar
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, current_plan, plan_end_date')
      .in('current_plan', ['basic', 'premium'])
      .not('plan_end_date', 'is', null)
      .gte('plan_end_date', today.toISOString())
      .lte('plan_end_date', in7Days.toISOString())

    if (error) {
      console.error('[CRON] Error fetching expiring plans:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      console.log('[CRON] No expiring plans found')
      return NextResponse.json({
        success: true,
        message: 'No expiring plans found',
        checked: 0,
        notified: 0
      })
    }

    console.log(`[CRON] Found ${users.length} plans expiring soon`)

    let notificationsSent = 0

    // Procesar cada usuario
    for (const user of users) {
      const planEndDate = new Date(user.plan_end_date!)
      const daysUntilExpiration = Math.ceil(
        (planEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Solo enviar notificaciones en días específicos: 7, 3, 1
      if (![7, 3, 1].includes(daysUntilExpiration)) {
        continue
      }

      const planName = user.current_plan === 'premium' ? 'Premium' : 'Básico'

      try {
        await sendNotification({
          userId: user.id,
          type: 'PLAN_EXPIRING',
          title: `Tu plan ${planName} expira en ${daysUntilExpiration} día${daysUntilExpiration > 1 ? 's' : ''}`,
          message: `Tu plan ${planName} expirará el ${planEndDate.toLocaleDateString('es-AR')}. Renueva ahora para mantener tus beneficios.`,
          channels: ['email', 'in_app'],
          metadata: {
            planType: user.current_plan,
            expirationDate: user.plan_end_date,
            daysRemaining: daysUntilExpiration,
            ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/planes`,
            ctaText: 'Renovar Plan'
          },
          relatedId: user.id,
          relatedType: 'plan_expiration'
        })

        notificationsSent++
        console.log(`[CRON] Notification sent to user ${user.id} (${daysUntilExpiration} days)`)

      } catch (err) {
        console.error(`[CRON] Failed to notify user ${user.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${users.length} expiring plans, sent ${notificationsSent} notifications`,
      checked: users.length,
      notified: notificationsSent
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
