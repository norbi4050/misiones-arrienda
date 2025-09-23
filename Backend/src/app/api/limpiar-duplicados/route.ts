import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, resetToDefaults } from '@/lib/mock-community-profiles'
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

export async function POST(request: NextRequest) {
  try {
    // Obtener perfiles actuales
    const profiles = getAllProfiles()
    
    // Encontrar duplicados
    const userIds = profiles.map(p => p.user.id)
    const duplicates = userIds.filter((id, index) => userIds.indexOf(id) !== index)
    
    console.log('Perfiles antes de limpiar:', profiles.length)
    console.log('IDs duplicados encontrados:', duplicates)
    
    // Limpiar todos los perfiles (resetear a vacío)
    resetToDefaults()
    
    console.log('✅ Perfiles duplicados eliminados. Base de datos limpia.')

    return NextResponse.json({
      success: true,
      message: "Perfiles duplicados eliminados correctamente",
      duplicatesFound: duplicates.length,
      totalProfilesBefore: profiles.length,
      totalProfilesAfter: 0
    })

  } catch (error) {
    console.error('Error limpiando duplicados:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
