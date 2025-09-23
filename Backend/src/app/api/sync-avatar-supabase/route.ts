import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
    
    // 1. Verificar datos actuales del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, avatar')
      .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
      .single()

    if (userError) {
      console.error('Error obteniendo usuario:', userError)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 2. Obtener avatar de autenticación
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
      '6403f9d2-e846-4c70-87e0-e051127d9500'
    )

    if (authError) {
      console.error('Error obteniendo datos de auth:', authError)
      return NextResponse.json({ error: 'Error de autenticación' }, { status: 500 })
    }

    const authAvatar = authData.user?.user_metadata?.avatar_url
    
    console.log('Avatar actual en BD:', userData.avatar)
    console.log('Avatar en auth:', authAvatar)

    // 3. Actualizar avatar en BD si es diferente
    if (authAvatar && userData.avatar !== authAvatar) {
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ avatar: authAvatar })
        .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
        .select()

      if (updateError) {
        console.error('Error actualizando avatar:', updateError)
        return NextResponse.json({ error: 'Error actualizando avatar' }, { status: 500 })
      }

      console.log('✅ Avatar sincronizado en Supabase')
      
      return NextResponse.json({
        success: true,
        message: "Avatar sincronizado correctamente",
        before: userData.avatar,
        after: authAvatar,
        updated: true
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Avatar ya está sincronizado",
        avatar: userData.avatar,
        updated: false
      })
    }

  } catch (error) {
    console.error('Error sincronizando avatar:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
