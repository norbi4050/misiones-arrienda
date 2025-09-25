import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper para generar timestamp epoch
function getTimestampEpoch(): number {
  return Math.floor(Date.now() / 1000)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Obtener userId del query params (público)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 })
    }

    // Obtener datos de user_profiles y users para construir avatar_url único
    const [profilesResult, usersResult] = await Promise.all([
      supabase.from('user_profiles').select('photos, updated_at, full_name').eq('id', userId).maybeSingle(),
      supabase.from('users').select('profile_image, name').eq('id', userId).maybeSingle()
    ])

    const userProfile = profilesResult.data
    const userData = usersResult.data
    const fullName = userProfile?.full_name || userData?.name || 'Usuario'

    // Construir avatar_url con fuente única: photos[0] → profile_image (DEPRECATED) → fallback
    const avatarUrl = 
      userProfile?.photos?.[0] ??
      userData?.profile_image ??  // DEPRECATED fallback temporal
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff&size=200`

    // Calcular v = epoch de user_profiles.updated_at
    const v = userProfile?.updated_at 
      ? Math.floor(new Date(userProfile.updated_at).getTime() / 1000)
      : 0

    // Si no hay avatar personalizado, devolver sin cache-busting
    if (!userProfile?.photos?.[0] && !userData?.profile_image) {
      return NextResponse.json({
        url: avatarUrl,  // Fallback URL sin ?v=
        v: v,
        source: 'fallback',
        user_id: userId,
        full_name: fullName
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60'
        }
      })
    }

    // Retornar avatar con cache-busting usando epoch
    const avatarUrlWithVersion = `${avatarUrl}?v=${v}`

    return NextResponse.json({
      url: avatarUrlWithVersion,
      v: v,
      source: userProfile?.photos?.[0] ? 'photos' : 'profile_image_deprecated',
      user_id: userId,
      full_name: fullName
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    })

  } catch (error) {
    console.error('Error in avatar GET:', error)
    return NextResponse.json({ error: 'NO_AVATAR' }, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    
    // Verificar si es upload de archivo o URL directa
    const contentType = request.headers.get('content-type')
    let avatarUrl: string

    if (contentType?.includes('multipart/form-data')) {
      // Upload de archivo al bucket avatars/<userId>/
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${timestamp}.${fileExt}`
      const filePath = `avatars/${userId}/${fileName}`

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError)
        return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      avatarUrl = publicUrlData.publicUrl

    } else {
      // URL directa desde JSON
      const { avatar_url } = await request.json()
      
      if (!avatar_url) {
        return NextResponse.json({ error: 'URL de avatar requerida' }, { status: 400 })
      }
      
      avatarUrl = avatar_url
    }

    // Actualizar photos[1] usando SQL directo para manejar text[] correctamente
    const now = new Date()
    
    // Usar UPDATE directo con array literal PostgreSQL para text[]
    const { data: updateResult, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        photos: [avatarUrl],  // Prisma maneja automáticamente la conversión a text[]
        updated_at: now.toISOString()
      })
      .eq('id', userId)
      .select('updated_at')
      .single()

    if (updateError) {
      console.error('Error updating avatar:', updateError)
      return NextResponse.json({ error: 'Error al actualizar avatar' }, { status: 500 })
    }

    // Calcular timestamp epoch del resultado
    const updatedAtEpoch = updateResult?.updated_at 
      ? Math.floor(new Date(updateResult.updated_at).getTime() / 1000)
      : Math.floor(now.getTime() / 1000)

    return NextResponse.json({ 
      url: `${avatarUrl}?v=${updatedAtEpoch}`,
      v: updatedAtEpoch,
      user_id: userId,
      success: true 
    })

  } catch (error) {
    console.error('Error in avatar POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')

    // Remover avatar poniendo array vacío
    const now = new Date()
    const { data: removeResult, error: removeError } = await supabase
      .from('user_profiles')
      .update({ 
        photos: [],  // Array vacío para remover avatar
        updated_at: now.toISOString()
      })
      .eq('id', userId)
      .select('updated_at')
      .single()

    if (removeError) {
      console.error('Error removing avatar:', removeError)
      return NextResponse.json({ error: 'Error al eliminar avatar' }, { status: 500 })
    }

    const updatedAtEpoch = removeResult?.updated_at 
      ? Math.floor(new Date(removeResult.updated_at).getTime() / 1000)
      : Math.floor(now.getTime() / 1000)

    return NextResponse.json({ 
      url: null,
      v: updatedAtEpoch,
      user_id: userId,
      success: true 
    })

  } catch (error) {
    console.error('Error in avatar DELETE:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
