// src/app/api/users/suspend/route.ts
// API para suspender/reactivar cuenta de usuario

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SuspendAccountRequest, SuspendAccountResponse } from '@/types/account'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[Suspend] ❌ No autorizado')
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }
    
    // 2. Parsear body
    const body: SuspendAccountRequest = await req.json().catch(() => ({ enable: true }))
    const { enable } = body
    
    console.log('[Suspend] Solicitud:', { userId: user.id, enable })
    
    // 3. Llamar a la función SQL
    const { data, error } = await supabase.rpc('suspend_profile', {
      p_enable: enable
    })
    
    if (error) {
      console.error('[Suspend] ❌ Error en función SQL:', error)
      return NextResponse.json(
        { 
          error: 'DB_ERROR', 
          message: 'Error al actualizar estado de cuenta',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    const response: SuspendAccountResponse = data as SuspendAccountResponse
    
    console.log('[Suspend] ✅ Cuenta actualizada:', response)
    
    return NextResponse.json({
      success: true,
      data: response,
      message: enable 
        ? 'Cuenta suspendida exitosamente' 
        : 'Cuenta reactivada exitosamente'
    })
    
  } catch (error: any) {
    console.error('[Suspend] ❌ Error inesperado:', error)
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: error?.message || 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
