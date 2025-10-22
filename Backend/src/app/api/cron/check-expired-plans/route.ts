/**
 * Cron Job: Verificar Planes Expirados
 *
 * Este endpoint se ejecuta diariamente para:
 * - Detectar planes que ya expiraron
 * - Desactivar planes expirados
 * - Enviar notificaciones PLAN_EXPIRED
 *
 * Configurado en vercel.json:
 * - Frecuencia: Diaria a las 1:00 AM
 * - URL: /api/cron/check-expired-plans
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

    console.log('[CRON] Checking expired plans...')

    const supabase = createClient()
    const today = new Date()

    // Buscar usuarios con planes expirados (plan_end_date < hoy)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, current_plan, plan_end_date')
      .in('current_plan', ['basic', 'premium'])
      .not('plan_end_date', 'is', null)
      .lt('plan_end_date', today.toISOString())

    if (error) {
      console.error('[CRON] Error fetching expired plans:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      console.log('[CRON] No expired plans found')
      return NextResponse.json({
        success: true,
        message: 'No expired plans found',
        checked: 0,
        expired: 0,
        notified: 0
      })
    }

    console.log(`[CRON] Found ${users.length} expired plans`)

    let plansExpired = 0
    let notificationsSent = 0
    const errors: string[] = []

    // Procesar cada usuario con plan expirado
    for (const user of users) {
      try {
        const planName = user.current_plan === 'premium' ? 'Premium' : 'Básico'
        const expirationDate = new Date(user.plan_end_date!)

        // 1. Desactivar el plan (cambiar a 'free')
        const { error: updateError } = await supabase
          .from('users')
          .update({
            current_plan: 'free',
            plan_end_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          throw new Error(`Failed to update user plan: ${updateError.message}`)
        }

        plansExpired++
        console.log(`[CRON] Plan expired for user ${user.id}, downgraded to free`)

        // 2. Enviar notificación
        await sendNotification({
          userId: user.id,
          type: 'PLAN_EXPIRED',
          title: `Tu plan ${planName} ha expirado`,
          message: `Tu plan ${planName} expiró el ${expirationDate.toLocaleDateString('es-AR')}. Has sido cambiado al plan gratuito. Renovalo para recuperar tus beneficios.`,
          channels: ['email', 'in_app'],
          metadata: {
            planType: user.current_plan,
            expirationDate: user.plan_end_date,
            newPlan: 'free',
            ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/mi-empresa/planes`,
            ctaText: 'Ver Planes'
          },
          relatedId: user.id,
          relatedType: 'plan_expired'
        })

        notificationsSent++
        console.log(`[CRON] Notification sent to user ${user.id}`)

      } catch (err) {
        const errorMsg = `Failed to process user ${user.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        console.error(`[CRON] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${users.length} expired plans, expired ${plansExpired}, sent ${notificationsSent} notifications`,
      checked: users.length,
      expired: plansExpired,
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
