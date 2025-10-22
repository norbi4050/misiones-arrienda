import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/check
 * Verifica si el usuario actual es administrador
 * Endpoint público (no requiere permisos) - solo retorna true/false
 */
export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin()

    return NextResponse.json({
      isAdmin,
    })
  } catch (error) {
    console.error('[AdminCheck] Error:', error)
    return NextResponse.json(
      { isAdmin: false },
      { status: 200 } // Siempre retornar 200 para evitar revelar información
    )
  }
}
