import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Obtener datos del usuario
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, user_type, is_company, company_name')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: error 
      }, { status: 500 })
    }

    // Verificar condiciones
    const checks = {
      is_company_value: userData?.is_company,
      is_company_type: typeof userData?.is_company,
      is_company_equals_true: userData?.is_company === true,
      user_type_value: userData?.user_type,
      user_type_upper: userData?.user_type?.toUpperCase(),
      user_type_is_inmobiliaria: userData?.user_type?.toUpperCase() === 'INMOBILIARIA',
      user_type_is_agency: userData?.user_type?.toUpperCase() === 'AGENCY',
      final_is_agency_check: userData?.is_company === true || 
                            userData?.user_type?.toUpperCase() === 'INMOBILIARIA' ||
                            userData?.user_type?.toUpperCase() === 'AGENCY'
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      userData,
      checks,
      should_redirect: checks.final_is_agency_check
    })
  } catch (error) {
    console.error('[Debug Agency Check] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
