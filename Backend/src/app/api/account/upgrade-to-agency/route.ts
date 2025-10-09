import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

/**
 * POST /api/account/upgrade-to-agency
 * 
 * Endpoint para actualizar el rol del usuario a INMOBILIARIA
 * después de completar el wizard de onboarding.
 * 
 * Este endpoint respeta RLS ya que usa el cliente SSR de Supabase.
 */
export async function POST() {
  try {
    const supabase = createSupabaseServer()
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'no-user' }, 
        { status: 401 }
      )
    }

    // Actualizar rol a INMOBILIARIA
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'INMOBILIARIA' })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[upgrade-to-agency] Error updating role:', updateError)
      return NextResponse.json(
        { ok: false, error: updateError.message }, 
        { status: 400 }
      )
    }

    console.log(`[upgrade-to-agency] User ${user.id} upgraded to INMOBILIARIA`)
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('[upgrade-to-agency] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'internal-server-error' }, 
      { status: 500 }
    )
  }
}
