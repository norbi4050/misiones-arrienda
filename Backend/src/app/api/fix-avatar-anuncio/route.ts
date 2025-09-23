import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getAllProfiles, updateProfile } from '@/lib/mock-community-profiles'
import { extractUserName } from '@/lib/user-utils'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener avatar real del usuario
    let userProfile
    try {
      const { data: dbProfile, error: dbError } = await supabase
        .from('users')
        .select('id, name, email, phone, bio, avatar')
        .eq('id', user.id)
        .single()

      if (!dbError && dbProfile) {
        userProfile = dbProfile
      }
    } catch (error) {
      console.log('No se pudo obtener perfil del usuario desde BD')
    }

    // Determinar avatar correcto
    const correctAvatar = userProfile?.avatar || user.user_metadata?.avatar_url || null
    const correctName = userProfile?.name || extractUserName(user) || 'Usuario'

    // Buscar y actualizar el anuncio del usuario
    const profiles = getAllProfiles()
    const userProfileIndex = profiles.findIndex(p => p.user.id === user.id)

    if (userProfileIndex === -1) {
      return NextResponse.json({ error: "No se encontró anuncio del usuario" }, { status: 404 })
    }

    // Actualizar avatar en el anuncio
    const updatedProfile = {
      ...profiles[userProfileIndex],
      user: {
        ...profiles[userProfileIndex].user,
        avatar: correctAvatar,
        name: correctName
      }
    }

    // Actualizar en el mock data
    updateProfile(user.id, updatedProfile)

    return NextResponse.json({
      success: true,
      message: "Avatar actualizado correctamente",
      avatar: correctAvatar,
      name: correctName,
      userId: user.id
    })

  } catch (error) {
    console.error('Error fixing avatar:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
