import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// POST /api/upload/avatar - Subir avatar de usuario
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    // Validar que el usuario solo puede subir su propio avatar
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes subir tu propio avatar' },
        { status: 403 }
      )
    }

    // Validar archivo
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo es muy grande (máximo 5MB)' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido (solo JPG, PNG, WebP)' },
        { status: 400 }
      )
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`
    const filePath = `avatars/${fileName}`

    // Convertir archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir archivo al almacenamiento' },
        { status: 500 }
      )
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      return NextResponse.json(
        { error: 'Error al generar URL del archivo' },
        { status: 500 }
      )
    }

    // Actualizar avatar en el perfil del usuario
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      
      // Intentar eliminar archivo subido si falla la actualización
      await supabase.storage
        .from('user-avatars')
        .remove([filePath])

      return NextResponse.json(
        { error: 'Error al actualizar perfil de usuario' },
        { status: 500 }
      )
    }

    // También actualizar en auth.users si es necesario
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: urlData.publicUrl
      }
    })

    if (authUpdateError) {
      console.error('Error updating auth user:', authUpdateError)
      // No es crítico, continuar
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      message: 'Avatar actualizado correctamente'
    }, { status: 200 })

  } catch (error) {
    console.error('Error in avatar upload:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/upload/avatar - Obtener información sobre límites de upload
export async function GET() {
  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
    maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    bucket: 'user-avatars'
  })
}
