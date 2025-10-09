/**
 * POST /api/auth/ensure-profile
 * 
 * Endpoint serverless para asegurar que existe un perfil en user_profiles.
 * Útil como fallback o para llamar desde el servidor usando cookies.
 * 
 * - Usa RLS (NO service role)
 * - user_profiles.user_id es TEXT
 * - role tiene default 'BUSCO' en DB
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  try {
    const cookieStore = cookies()
    
    // Crear cliente de Supabase usando las cookies (RLS habilitado)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: 'no-user' },
        { status: 401 }
      )
    }

    // Upsert en user_profiles
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id, // TEXT en DB
          // role: NO lo enviamos, usa default 'BUSCO' del schema
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )

    if (upsertError) {
      console.error('[ensure-profile] Error en upsert:', upsertError)
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[ensure-profile] Error inesperado:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
