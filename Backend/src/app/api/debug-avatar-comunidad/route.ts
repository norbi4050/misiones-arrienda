import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener datos del perfil del usuario desde BD
    const { data: dbProfile, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, phone, bio, avatar')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      authMetadata: user.user_metadata,
      dbProfile: dbProfile,
      dbError: dbError,
      avatarFromDB: dbProfile?.avatar,
      avatarFromAuth: user.user_metadata?.avatar_url
    })

  } catch (error) {
    console.error('Error debugging avatar:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
