import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../../lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()

    // Primer intento: usar vista v_profiles_for_ui si existe
    let { data: profiles, error } = await supabase
      .from('v_profiles_for_ui')
      .select('profile_id, user_id, display_name, avatar_url, bio, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    // Si la vista no existe, usar tabla profiles
    if (error) {
      console.log('Vista v_profiles_for_ui no existe, usando tabla profiles:', error.message)
      
      // Segundo intento: usar tabla profiles con columnas estándar
      const { data: profilesStandard, error: standardError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, bio, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

        if (!standardError && profilesStandard) {
        // Agregar profile_id para consistencia con la vista
        profiles = profilesStandard.map((profile: any) => ({
          profile_id: profile.user_id, // Usar user_id como profile_id
          ...profile
        }))
      } else {
        console.log('Columnas estándar no existen, intentando con full_name:', standardError?.message)
        
        // Tercer intento: usar full_name como display_name
        const { data: profilesFullName, error: fullNameError } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, bio, created_at')
          .order('created_at', { ascending: false })
          .limit(50)

        if (!fullNameError && profilesFullName) {
          // Mapear full_name a display_name
          profiles = profilesFullName.map((profile: any) => ({
            profile_id: profile.user_id,
            user_id: profile.user_id,
            display_name: profile.full_name || profile.user_id,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            created_at: profile.created_at
          }))
        } else {
          console.log('full_name no existe, intentando con name:', fullNameError?.message)
          
          // Cuarto intento: usar name como display_name
          const { data: profilesName, error: nameError } = await supabase
            .from('profiles')
            .select('user_id, name, avatar_url, bio, created_at')
            .order('created_at', { ascending: false })
            .limit(50)

          if (!nameError && profilesName) {
            // Mapear name a display_name
            profiles = profilesName.map((profile: any) => ({
              profile_id: profile.user_id,
              user_id: profile.user_id,
              display_name: profile.name || profile.user_id,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
              created_at: profile.created_at
            }))
          } else {
            console.log('name no existe, intentando sin order:', nameError?.message)
            
            // Quinto intento: sin ordenamiento
            const { data: profilesNoOrder, error: noOrderError } = await supabase
              .from('profiles')
              .select('user_id, display_name, avatar_url, bio')
              .limit(50)

            if (!noOrderError && profilesNoOrder) {
              profiles = profilesNoOrder.map((profile: any) => ({
                profile_id: profile.user_id,
                ...profile,
                created_at: null
              }))
            } else {
              console.error('Todos los intentos fallaron:', noOrderError?.message)
              return NextResponse.json(
                { error: 'Error al obtener perfiles de la comunidad', details: error.message },
                { status: 500 }
              )
            }
          }
        }
      }
    }

    return NextResponse.json({ profiles: profiles || [] })

  } catch (error) {
    console.error('Error en API de perfiles de comunidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
