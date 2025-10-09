// ============================================================================
// DEPRECATED: Este endpoint está obsoleto desde FASE 2
// TODO: Eliminar en próxima versión mayor
// Usar /api/users/avatar en su lugar
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'

// LEGACY ENDPOINT - DEPRECATED
// Redirigir todas las peticiones a /api/users/avatar

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'DEPRECATED_ENDPOINT', 
    message: 'Este endpoint está obsoleto. Usar /api/users/avatar',
    redirect_to: '/api/users/avatar',
    deprecated_since: '2025-01-01'
  }, { 
    status: 410,  // 410 Gone
    headers: {
      'X-Deprecated': 'true',
      'X-Redirect-To': '/api/users/avatar'
    }
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    error: 'DEPRECATED_ENDPOINT',
    message: 'Este endpoint está obsoleto. Usar /api/users/avatar',
    redirect_to: '/api/users/avatar',
    deprecated_since: '2025-01-01'
  }, { 
    status: 410,  // 410 Gone
    headers: {
      'X-Deprecated': 'true',
      'X-Redirect-To': '/api/users/avatar'
    }
  })
}
