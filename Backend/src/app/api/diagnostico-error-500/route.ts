import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles } from '@/lib/mock-community-profiles'
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
    console.log('🔍 Iniciando diagnóstico de error 500...')

    // 1. Verificar autenticación
    let authStatus = 'Sin verificar'
    let user = null
    try {
      const supabase = await getServerSupabase()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        authStatus = `Error auth: ${authError.message}`
      } else if (authUser) {
        authStatus = '✅ Usuario autenticado'
        user = authUser
      } else {
        authStatus = '❌ No autenticado'
      }
    } catch (error) {
      authStatus = `Error Supabase: ${error}`
    }

    // 2. Verificar perfiles en memoria
    let profilesStatus = 'Sin verificar'
    let profilesCount = 0
    let userProfile = null
    try {
      const profiles = getAllProfiles()
      profilesCount = profiles.length
      profilesStatus = `✅ ${profilesCount} perfiles en memoria`
      
      if (user) {
        userProfile = profiles.find(p => p.user.id === user.id)
        if (userProfile) {
          profilesStatus += ` (Usuario tiene anuncio)`
        } else {
          profilesStatus += ` (Usuario SIN anuncio)`
        }
      }
    } catch (error) {
      profilesStatus = `Error perfiles: ${error}`
    }

    // 3. Verificar variables de entorno
    const envStatus = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante'
    }

    // 4. Verificar imports
    let importsStatus = 'Sin verificar'
    try {
      // Verificar que las funciones existen
      const { updateProfile } = await import('@/lib/mock-community-profiles')
      const { extractUserName } = await import('@/lib/user-utils')
      importsStatus = '✅ Imports funcionando'
    } catch (error) {
      importsStatus = `Error imports: ${error}`
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      diagnostico: {
        auth: authStatus,
        profiles: profilesStatus,
        env: envStatus,
        imports: importsStatus
      },
      detalles: {
        userId: user?.id || null,
        userName: user?.user_metadata?.name || null,
        userEmail: user?.email || null,
        profilesCount,
        userHasProfile: !!userProfile,
        userProfileId: userProfile?.id || null
      },
      recomendaciones: [
        authStatus.includes('❌') ? 'Iniciar sesión en la aplicación' : null,
        profilesCount === 0 ? 'Crear un anuncio primero' : null,
        !userProfile && user ? 'Usuario autenticado pero sin anuncio' : null
      ].filter(Boolean)
    })

  } catch (error) {
    console.error('Error en diagnóstico:', error)
    return NextResponse.json({
      error: 'Error en diagnóstico',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}
