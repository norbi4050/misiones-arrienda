/**
 * API Endpoint: Actualizar Presencia del Usuario
 * 
 * POST /api/presence/update
 * 
 * Marca al usuario como online y actualiza su timestamp de actividad.
 * Este endpoint es llamado periódicamente por el frontend (cada ~60 segundos)
 * para mantener actualizado el estado de presencia del usuario.
 * 
 * @created 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateUserActivity } from '@/lib/presence/activity-tracker'

/**
 * POST /api/presence/update
 * 
 * Body: { userId: string }
 * 
 * Response: { success: boolean, error?: string }
 */
export async function POST(request: NextRequest) {
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

    // Actualizar actividad del usuario
    await updateUserActivity(userId)

    // Respuesta exitosa
    return NextResponse.json({ 
      success: true 
    })

  } catch (error) {
    console.error('[API] /api/presence/update - Error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update presence' 
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
