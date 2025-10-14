// src/app/api/users/delete/route.ts
// API para eliminar cuenta de usuario (soft delete)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DeleteAccountResponse } from '@/types/account'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[Delete] ❌ No autorizado')
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }
    
    console.log('[Delete] Solicitud de eliminación:', { userId: user.id })
    
    // 2. Llamar a la función SQL de soft delete
    const { data, error } = await supabase.rpc('soft_delete_profile')
    
    if (error) {
      console.error('[Delete] ❌ Error en función SQL:', error)
      return NextResponse.json(
        { 
          error: 'DB_ERROR', 
          message: 'Error al eliminar cuenta',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    const response: DeleteAccountResponse = data as DeleteAccountResponse
    
    console.log('[Delete] ✅ Cuenta eliminada (soft delete):', response)
    
    // 3. Cerrar sesión del usuario
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('[Delete] ⚠️ Error al cerrar sesión:', signOutError)
      // No bloquear la respuesta, la cuenta ya fue eliminada
    }
    
    return NextResponse.json({
      success: true,
      data: response,
      message: 'Tu cuenta ha sido eliminada. Serás redirigido al inicio.'
    })
    
  } catch (error: any) {
    console.error('[Delete] ❌ Error inesperado:', error)
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: error?.message || 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
