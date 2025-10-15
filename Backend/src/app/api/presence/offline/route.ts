/**
 * API Endpoint: Marcar Usuario como Offline
 * 
 * POST /api/presence/offline
 * 
 * Marca al usuario como offline y registra el timestamp de última conexión.
 * Este endpoint es llamado cuando el usuario cierra la pestaña/navegador
 * o cuando se detecta inactividad prolongada.
 * 
 * @created 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { markUserOffline } from '@/lib/presence/activity-tracker'
import { getPresenceMode } from '@/utils/env'

/**
 * POST /api/presence/offline
 * 
 * Body: { userId: string }
 * 
 * Response: { success: boolean, error?: string }
 */
export async function POST(request: NextRequest) {
  // ⚠️ GUARD: En modo 'realtime', este endpoint está deshabilitado
  if (getPresenceMode() === 'realtime') {
    return NextResponse.json(
      { 
        success: false,
        error: 'PRESENCE_DB_DISABLED',
        message: 'Database-based presence tracking is disabled. Using Realtime Presence instead.'
      },
      { status: 410 } // 410 Gone
    )
  }

  try {
    // Parsear body
    const body = await request.json()
    const { userId } = body

    // Validar userId
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'userId is required and must be a string' 
        },
        { status: 400 }
      )
    }

    // Marcar usuario como offline
    await markUserOffline(userId)

    // Respuesta exitosa
    return NextResponse.json({ 
      success: true 
    })

  } catch (error) {
    console.error('[API] /api/presence/offline - Error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to mark user offline' 
      },
      { status: 500 }
    )
  }
}

/**
 * Método OPTIONS para CORS (si es necesario)
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Allow': 'POST, OPTIONS'
      }
    }
  )
}
