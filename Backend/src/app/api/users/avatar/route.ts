import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización o query params
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const userId = authHeader?.replace('Bearer ', '') || searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 })
    }

    // Obtener perfil del usuario con avatar
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, photos, updated_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 })
    }

    // Extraer primera foto como avatar con cache-busting
    const avatarUrl = profile?.photos?.[0] 
      ? `${profile.photos[0]}?v=${profile.updated_at}`
      : null

    return NextResponse.json({ 
      avatar_url: avatarUrl,
      user_id: userId,
      cache_version: profile.updated_at,
      success: true 
    })

  } catch (error) {
    console.error('Error in avatar GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    const { avatar_url } = await request.json()

    if (!avatar_url) {
      return NextResponse.json({ error: 'URL de avatar requerida' }, { status: 400 })
    }

    // Obtener perfil actual
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('photos')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError)
      return NextResponse.json({ error: 'Error al obtener perfil actual' }, { status: 500 })
    }

    // Actualizar primera posición del array photos con nuevo avatar
    const updatedPhotos = currentProfile?.photos || []
    updatedPhotos[0] = avatar_url

    // Actualizar perfil con nuevo avatar y timestamp
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        photos: updatedPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, photos, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating avatar:', updateError)
      return NextResponse.json({ error: 'Error al actualizar avatar' }, { status: 500 })
    }

    // Retornar avatar con cache-busting
    const newAvatarUrl = `${avatar_url}?v=${updatedProfile.updated_at}`

    return NextResponse.json({ 
      avatar_url: newAvatarUrl,
      user_id: userId,
      cache_version: updatedProfile.updated_at,
      success: true 
    })

  } catch (error) {
    console.error('Error in avatar POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')

    // Obtener perfil actual
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('photos')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError)
      return NextResponse.json({ error: 'Error al obtener perfil actual' }, { status: 500 })
    }

    // Remover primera foto (avatar) del array
    const updatedPhotos = currentProfile?.photos || []
    updatedPhotos[0] = null

    // Actualizar perfil sin avatar
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        photos: updatedPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error removing avatar:', updateError)
      return NextResponse.json({ error: 'Error al eliminar avatar' }, { status: 500 })
    }

    return NextResponse.json({ 
      avatar_url: null,
      user_id: userId,
      success: true 
    })

  } catch (error) {
    console.error('Error in avatar DELETE:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
