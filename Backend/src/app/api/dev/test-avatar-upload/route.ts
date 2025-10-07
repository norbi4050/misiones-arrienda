import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Ruta DEV para probar flujo de avatar sin token del usuario
export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Endpoint solo disponible en desarrollo' }, { status: 403 })
    }

    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    // Crear imagen mínima en memoria (1x1 pixel PNG)
    const minimalPngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // image data
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // more data
      0x73, 0x75, 0x01, 0x18, 0x00, 0x00, 0x00, 0x00, // end
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  // IEND chunk
    ])

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `avatar-dev-${timestamp}.png`
    const filePath = `avatars/${userId}/${fileName}`

    console.log(`🔧 DEV: Subiendo imagen mínima a ${filePath}`)

    // Subir imagen al bucket usando admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, minimalPngBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Error uploading to storage:', uploadError)
      return NextResponse.json({ error: 'Error al subir archivo', details: uploadError }, { status: 500 })
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = publicUrlData.publicUrl
    console.log(`✅ DEV: Imagen subida exitosamente: ${avatarUrl}`)

    // Actualizar user_profiles.avatar_url usando admin client (bypass RLS)
    const now = new Date()
    
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        avatar_url: avatarUrl,  // Actualizar avatar_url con nueva URL
        updated_at: now.toISOString()
      })
      .eq('id', userId)
      .select('updated_at')
      .single()

    if (updateError) {
      console.error('❌ Error updating user_profiles:', updateError)
      return NextResponse.json({ error: 'Error al actualizar perfil', details: updateError }, { status: 500 })
    }

    // Calcular v = epoch tras el update
    const updatedAtEpoch = updateResult?.updated_at 
      ? Math.floor(new Date(updateResult.updated_at).getTime() / 1000)
      : Math.floor(now.getTime() / 1000)

    console.log(`✅ DEV: Avatar actualizado exitosamente. v=${updatedAtEpoch}`)

    return NextResponse.json({ 
      url: `${avatarUrl}?v=${updatedAtEpoch}`,
      v: updatedAtEpoch,
      user_id: userId,
      success: true,
      dev_note: 'Avatar de prueba subido usando admin client',
      file_path: filePath,
      timestamp: timestamp
    })

  } catch (error) {
    console.error('❌ Error in DEV avatar upload:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// GET para verificar estado actual
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Endpoint solo disponible en desarrollo' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    // Obtener estado actual usando admin client
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('avatar_url, updated_at, display_name')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado', 
        details: error,
        user_id: userId 
      }, { status: 404 })
    }

    const v = profile.updated_at 
      ? Math.floor(new Date(profile.updated_at).getTime() / 1000)
      : 0

    return NextResponse.json({
      user_id: userId,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url || null,
      v: v,
      updated_at: profile.updated_at,
      dev_note: 'Estado actual del avatar usando admin client'
    })

  } catch (error) {
    console.error('❌ Error in DEV avatar status:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
