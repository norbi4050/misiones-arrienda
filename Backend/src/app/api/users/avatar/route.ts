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

    // Obtener perfil del usuario desde vista pública (evita RLS)
    const { data: profile, error } = await supabase
      .from('public_user_profiles')
      .select('user_id, full_name, avatar_url, updated_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      // Devolver 200 con avatarUrl null en lugar de 404
      return NextResponse.json({
        avatarUrl: null,
        source: 'none',
        user_id: userId,
        full_name: null,
        updated_at: null
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60'
        }
      })
    }

    // Siempre devolver 200, incluso sin avatar
    if (!profile?.avatar_url) {
      return NextResponse.json({
        avatarUrl: null,
        source: 'none',
        user_id: userId,
        full_name: profile?.full_name || null,
        updated_at: profile?.updated_at || null
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60'
        }
      })
    }

    // Retornar avatar con cache-busting usando epoch
    const updatedAtEpoch = profile.updated_at ? Math.floor(new Date(profile.updated_at).getTime() / 1000) : getTimestampEpoch()
    const avatarUrl = `${profile.avatar_url}?v=${updatedAtEpoch}`

    return NextResponse.json({
      url: avatarUrl,
      v: updatedAtEpoch,
      source: 'supabase',
      user_id: userId,
      full_name: profile.full_name
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
