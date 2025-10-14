import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient()
    const userId = params.userId

    console.log('[DEBUG] Buscando usuario:', userId)

    // Intentar obtener desde User
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('[DEBUG] User data:', userData)
    console.log('[DEBUG] User error:', userError)

    // Intentar obtener desde UserProfile
    const { data: profileData, error: profileError } = await supabase
      .from('UserProfile')
      .select('*')
      .eq('userId', userId)
      .single()

    console.log('[DEBUG] UserProfile data:', profileData)
    console.log('[DEBUG] UserProfile error:', profileError)

    return NextResponse.json({
      userId,
      userData: userData || null,
      userError: userError || null,
      profileData: profileData || null,
      profileError: profileError || null,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error en debugging',
      details: error.message 
    }, { status: 500 })
  }
}
