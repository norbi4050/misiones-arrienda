import { NextRequest, NextResponse } from 'next/server'

// Temporalmente deshabilitado para evitar errores de build
// Este endpoint será reactivado después de resolver problemas de renderizado estático

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'Verificación de email temporalmente deshabilitada',
      status: 'maintenance' 
    },
    { status: 503 }
  )
}
