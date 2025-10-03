import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar datos en users
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type, profile_image, logo_url')
      .eq('id', user.id)
      .single()

    // Verificar datos en user_profiles
    const { data: profileData } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, photos, updated_at')
      .eq('user_id', user.id)
      .single()

    // Verificar archivos en bucket avatars
    const { data: avatarFiles } = await supabaseAdmin.storage
      .from('avatars')
      .list(user.id)

    // Verificar archivos en bucket company-logos
    const { data: logoFiles } = await supabaseAdmin.storage
      .from('company-logos')
      .list(user.id)

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      users_table: {
        user_type: userData?.user_type,
        profile_image: userData?.profile_image,
        logo_url: userData?.logo_url
      },
      user_profiles_table: {
        exists: !!profileData,
        photos: profileData?.photos || null,
        updated_at: profileData?.updated_at || null
      },
      storage_avatars: {
        files_count: avatarFiles?.length || 0,
        files: avatarFiles?.map(f => f.name) || []
      },
      storage_logos: {
        files_count: logoFiles?.length || 0,
        files: logoFiles?.map(f => f.name) || []
      }
    })

  } catch (error: any) {
    console.error('Error en diagnóstico:', error)
    return NextResponse.json({ 
      error: 'Error interno',
      details: error.message 
    }, { status: 500 })
  }
}
