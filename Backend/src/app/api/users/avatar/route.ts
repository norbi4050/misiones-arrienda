import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

// POST - Subir avatar con SSoT en User.profile_image
export async function POST(request: NextRequest) {
  console.log('=== POST /api/users/avatar - UPLOAD AVATAR ===')
  
  try {
    // Crear cliente Supabase con cookies
    const supabase = await getServerSupabase();

    // Verificar autenticación via cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Usuario no autenticado:', authError?.message)
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ Usuario autenticado:', user.id)

    // Obtener archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF' },
        { status: 400 }
      )
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Archivo muy grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    console.log('📁 Archivo válido:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`)

    // PASO 1: Obtener avatar anterior para limpieza
    let oldAvatarPath = null
    try {
      const { data: userData } = await supabase
        .from('User')
        .select('profile_image')
        .eq('id', user.id)
        .single()

      if (userData?.profile_image) {
        // Extraer path del URL público
        const url = new URL(userData.profile_image)
        oldAvatarPath = url.pathname.replace('/storage/v1/object/public/avatars/', '')
        console.log('🗂️ Avatar anterior encontrado:', oldAvatarPath)
      }
    } catch (error) {
      console.log('⚠️ No se pudo obtener avatar anterior:', error)
    }

    // PASO 2: Generar path único para el nuevo avatar
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-avatar.${fileExtension}`
    const filePath = `${user.id}/avatar/${fileName}`

    console.log('📤 Subiendo a:', filePath)

    // PASO 3: Convertir archivo a buffer
    const fileBuffer = await file.arrayBuffer()

    // PASO 4: Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError)
      return NextResponse.json(
        { error: `Error subiendo archivo: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Archivo subido exitosamente')

    // PASO 5: Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl
    console.log('🔗 URL pública generada:', publicUrl)

    // PASO 6: Actualizar User.profile_image (SSoT)
    const now = new Date().toISOString()
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        profile_image: publicUrl,
        updated_at: now
      })
      .eq('id', user.id)
      .select('id, name, email, profile_image, updated_at')
      .single()

    if (updateError) {
      console.error('❌ Error actualizando perfil:', updateError)
      
      // Limpiar archivo subido si falla la actualización
      await supabase.storage
        .from('avatars')
        .remove([filePath])

      return NextResponse.json(
        { error: `Error actualizando perfil: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Perfil actualizado exitosamente')

    // PASO 7: Limpiar avatar anterior
    if (oldAvatarPath && oldAvatarPath !== filePath) {
      console.log('🧹 Limpiando avatar anterior:', oldAvatarPath)
      try {
        await supabase.storage
          .from('avatars')
          .remove([oldAvatarPath])
        console.log('✅ Avatar anterior eliminado')
      } catch (error) {
        console.log('⚠️ Error limpiando avatar anterior:', error)
      }
    }

    // PASO 8: Responder con perfil actualizado para rehidratar UserContext
    return NextResponse.json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      user: updatedUser,
      imageUrl: `${publicUrl}?v=${new Date(now).getTime()}` // Cache-busting
    })

  } catch (error) {
    console.error('💥 Error crítico en avatar upload:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener información del avatar actual
export async function GET(request: NextRequest) {
  console.log('=== GET /api/users/avatar - GET AVATAR INFO ===')
  
  try {
    // Crear cliente Supabase con cookies
    const supabase = await getServerSupabase();

    // Verificar autenticación via cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Obtener datos del avatar desde User table (SSoT)
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('profile_image, name, updated_at')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('❌ Error obteniendo datos del usuario:', fetchError)
      return NextResponse.json(
        { error: 'Error obteniendo datos del usuario' },
        { status: 500 }
      )
    }

    // Generar URL con cache-busting
    const imageUrl = userData?.profile_image && userData?.updated_at
      ? `${userData.profile_image}?v=${new Date(userData.updated_at).getTime()}`
      : userData?.profile_image

    return NextResponse.json({
      success: true,
      profile_image: userData?.profile_image || null,
      imageUrl,
      name: userData?.name,
      updated_at: userData?.updated_at
    })

  } catch (error) {
    console.error('💥 Error crítico en avatar GET:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar avatar
export async function DELETE(request: NextRequest) {
  console.log('=== DELETE /api/users/avatar - DELETE AVATAR ===')
  
  try {
    // Crear cliente Supabase con cookies
    const supabase = await getServerSupabase();

    // Verificar autenticación via cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Obtener avatar actual
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('profile_image')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('❌ Error obteniendo datos del usuario:', fetchError)
      return NextResponse.json(
        { error: 'Error obteniendo datos del usuario' },
        { status: 500 }
      )
    }

    // Eliminar archivo del storage si existe
    if (userData?.profile_image) {
      try {
        const url = new URL(userData.profile_image)
        const filePath = url.pathname.replace('/storage/v1/object/public/avatars/', '')
        
        await supabase.storage
          .from('avatars')
          .remove([filePath])
        
        console.log('✅ Archivo eliminado del storage')
      } catch (error) {
        console.log('⚠️ Error eliminando archivo del storage:', error)
      }
    }

    // Actualizar User.profile_image a null (SSoT)
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('User')
      .update({
        profile_image: null,
        updated_at: now
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error actualizando perfil:', updateError)
      return NextResponse.json(
        { error: 'Error eliminando avatar del perfil' },
        { status: 500 }
      )
    }

    console.log('✅ Avatar eliminado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Avatar eliminado exitosamente'
    })

  } catch (error) {
    console.error('💥 Error crítico en avatar DELETE:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
