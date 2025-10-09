// src/app/api/users/status/route.ts
// API para obtener el estado actual de la cuenta

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AccountStatusResponse } from '@/types/account'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[Status] ❌ No autorizado')
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }
    
    // 2. Llamar a la función SQL
    const { data, error } = await supabase.rpc('get_account_status')
    
    if (error) {
      console.error('[Status] ❌ Error en función SQL:', error)
      return NextResponse.json(
        { 
          error: 'DB_ERROR', 
          message: 'Error al obtener estado de cuenta',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    const response: AccountStatusResponse = data as AccountStatusResponse
    
    console.log('[Status] ✅ Estado obtenido:', { 
      userId: response.user_id, 
      status: response.status 
    })
    
    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error: any) {
    console.error('[Status] ❌ Error inesperado:', error)
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: error?.message || 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
