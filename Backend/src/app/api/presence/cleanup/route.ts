/**
 * API Route: /api/presence/cleanup
 * 
 * Endpoint para ejecutar la limpieza de presencia stale.
 * Marca como offline a usuarios que no han tenido actividad reciente.
 * 
 * Este endpoint debe ser llamado periódicamente por:
 * - Cron job (Vercel Cron)
 * - Scheduled task
 * - Admin manual
 * 
 * @created 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/presence/cleanup
 * 
 * Ejecuta la función RPC cleanup_stale_presence para marcar
 * como offline a usuarios sin actividad reciente.
 * 
 * Query params opcionales:
 * - threshold: Minutos de inactividad (default: 5)
 * - auth_token: Token de autorización para cron jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener parámetros
    const { searchParams } = new URL(request.url)
    const threshold = parseInt(searchParams.get('threshold') || '5', 10)
    const authToken = searchParams.get('auth_token')
    
    // Validar threshold
    if (threshold < 1 || threshold > 60) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Threshold debe estar entre 1 y 60 minutos' 
        },
        { status: 400 }
      )
    }

    // Verificar autorización
    // OPCIÓN 1: Token de cron job (para Vercel Cron)
    const CRON_SECRET = process.env.CRON_SECRET
    if (CRON_SECRET && authToken !== CRON_SECRET) {
      console.warn('[presence/cleanup] Intento de acceso no autorizado')
      return NextResponse.json(
        { 
          success: false, 
          error: 'No autorizado' 
        },
        { status: 401 }
      )
    }

    // OPCIÓN 2: Usuario admin autenticado (si no hay CRON_SECRET)
    if (!CRON_SECRET) {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.warn('[presence/cleanup] Usuario no autenticado')
        return NextResponse.json(
          { 
            success: false, 
            error: 'No autenticado' 
          },
          { status: 401 }
        )
      }

      // Verificar si es admin (opcional - ajustar según tu lógica)
      // const { data: profile } = await supabase
      //   .from('UserProfile')
      //   .select('role')
      //   .eq('userId', user.id)
      //   .single()
      // 
      // if (profile?.role !== 'admin') {
      //   return NextResponse.json(
      //     { success: false, error: 'Requiere permisos de admin' },
      //     { status: 403 }
      //   )
      // }
    }

    console.info(`[presence/cleanup] Iniciando limpieza con threshold de ${threshold} minutos`)

    // Crear cliente Supabase con service_role para ejecutar RPC
    const supabase = await createClient()

    // Ejecutar función RPC de limpieza
    const { data, error } = await supabase.rpc('cleanup_stale_presence', {
      threshold_minutes: threshold
    })

    if (error) {
      console.error('[presence/cleanup] Error ejecutando RPC:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error ejecutando limpieza',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Extraer resultados
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data
    const usersMarkedOffline = result?.users_marked_offline || 0
    const executionTime = result?.execution_time || new Date().toISOString()

    console.info(`[presence/cleanup] Limpieza completada: ${usersMarkedOffline} usuarios marcados offline`)

    return NextResponse.json({
      success: true,
      data: {
        usersMarkedOffline,
        executionTime,
        threshold
      },
      message: `${usersMarkedOffline} usuarios marcados como offline`
    })

  } catch (error: any) {
    console.error('[presence/cleanup] Error inesperado:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/presence/cleanup
 * 
 * Endpoint de información (opcional)
 * Retorna información sobre el sistema de limpieza
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/presence/cleanup',
    method: 'POST',
    description: 'Limpia presencia stale marcando usuarios inactivos como offline',
    parameters: {
      threshold: 'Minutos de inactividad (default: 5, min: 1, max: 60)',
      auth_token: 'Token de autorización para cron jobs (opcional si CRON_SECRET está configurado)'
    },
    usage: {
      cron: 'POST /api/presence/cleanup?auth_token=YOUR_CRON_SECRET',
      manual: 'POST /api/presence/cleanup?threshold=10',
      default: 'POST /api/presence/cleanup'
    },
    notes: [
      'Debe ejecutarse cada 5-10 minutos para mantener presencia actualizada',
      'Threshold recomendado: 5 minutos',
      'Actualiza ambas tablas: User y UserProfile',
      'Requiere CRON_SECRET en variables de entorno para cron jobs'
    ]
  })
}
