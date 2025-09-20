import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Crear cliente Supabase con Service Role
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Contar propiedades visibles públicamente (mismo filtro que el listado)
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PUBLISHED', 'AVAILABLE'])
      .eq('is_active', true)

    if (error) {
      console.error('Error contando propiedades:', error)
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    return NextResponse.json({ count: count || 0 })

  } catch (error) {
    console.error('Error en properties-count:', error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}

export const runtime = 'nodejs'
