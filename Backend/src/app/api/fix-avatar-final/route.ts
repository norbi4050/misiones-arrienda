import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, updateProfile } from '@/lib/mock-community-profiles'
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
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
    // Obtener usuario autenticado
    const supabase = await getServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Buscar anuncio existente del usuario
    const profiles = getAllProfiles()
    const userProfile = profiles.find(p => p.user.id === user.id)

    if (!userProfile) {
      return NextResponse.json({ error: "No se encontró anuncio del usuario" }, { status: 404 })
    }

    // Obtener avatar correcto del usuario autenticado
    const correctAvatar = user.user_metadata?.avatar_url || null
    const correctName = extractUserName(user) || userProfile.user.name

    console.log('Avatar actual del anuncio:', userProfile.user.avatar)
    console.log('Avatar correcto de auth:', correctAvatar)

    // Actualizar anuncio con avatar correcto
    const updatedProfile = {
      ...userProfile,
      user: {
        ...userProfile.user,
        avatar: correctAvatar,
        name: correctName
      }
    }

    // Guardar cambios
    const success = updateProfile(user.id, updatedProfile)

    if (success) {
      console.log('✅ Avatar del anuncio actualizado correctamente')
      
      return NextResponse.json({
        success: true,
        message: "Avatar del anuncio actualizado correctamente",
        before: userProfile.user.avatar,
        after: correctAvatar,
        userId: user.id,
        userName: correctName
      })
    } else {
      return NextResponse.json({ error: "Error actualizando anuncio" }, { status: 500 })
    }

  } catch (error) {
    console.error('Error fixing avatar:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
