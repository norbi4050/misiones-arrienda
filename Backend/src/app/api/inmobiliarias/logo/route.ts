import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

// POST - Upload logo
export async function POST(request: NextRequest) {
  console.log('[LOGO] Iniciando upload de logo...')
  
  try {
    // 1. Autenticación usando el cliente SSR estándar
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[LOGO] Usuario no autenticado:', authError?.message)
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    console.log('[LOGO] Usuario autenticado:', user.id)
    
    // 2. Verificar que es inmobiliaria (usando admin client para queries)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type, email')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.user_type !== 'inmobiliaria') {
      console.error('[LOGO] Usuario no es inmobiliaria:', userData?.user_type)
      return NextResponse.json(
        { error: 'Solo inmobiliarias pueden subir logos' },
        { status: 403 }
      )
    }
    
    console.log('[LOGO] Usuario verificado como inmobiliaria:', userData.email)
    
    // 3. Obtener archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('[LOGO] No se recibió archivo')
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      )
    }
    
    console.log('[LOGO] Archivo recibido:', file.name, file.type, file.size)
    
    // 4. Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('[LOGO] Tipo de archivo no permitido:', file.type)
      return NextResponse.json(
        { 
          error: 'Tipo de archivo no permitido',
          details: 'Solo se permiten archivos PNG, JPG o JPEG'
        },
        { status: 400 }
      )
    }
    
    // 5. Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      console.error('[LOGO] Archivo muy grande:', file.size)
      return NextResponse.json(
        { 
          error: 'Archivo muy grande',
          details: `El tamaño máximo es 2MB. Tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      )
    }
    
    // 6. Preparar nombre de archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `logo.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    
    console.log('[LOGO] Ruta del archivo:', filePath)
    
    // 7. Eliminar logo anterior si existe (usando admin client para storage)
    try {
      const { data: existingFiles } = await supabaseAdmin.storage
        .from('company-logos')
        .list(user.id)
      
      if (existingFiles && existingFiles.length > 0) {
        console.log('[LOGO] Eliminando logos anteriores...')
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`)
        await supabaseAdmin.storage
          .from('company-logos')
          .remove(filesToDelete)
        console.log('[LOGO] Logos anteriores eliminados')
      }
    } catch (cleanupError) {
      console.warn('[LOGO] Error limpiando logos anteriores:', cleanupError)
      // Continuar de todos modos
    }
    
    // 8. Subir archivo a Storage (usando admin client)
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('company-logos')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      console.error('[LOGO] Error subiendo archivo:', uploadError)
      return NextResponse.json(
        { 
          error: 'Error subiendo archivo',
          details: uploadError.message
        },
        { status: 500 }
      )
    }
    
    console.log('[LOGO] Archivo subido exitosamente:', uploadData.path)
    
    // 9. Obtener URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('company-logos')
      .getPublicUrl(filePath)
    
    const logoUrl = publicUrlData.publicUrl
    console.log('[LOGO] URL pública:', logoUrl)
    
    // 10. Actualizar tabla users con logo_url (usando admin client)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('[LOGO] Error actualizando perfil:', updateError)
      // No fallar si el upload fue exitoso
      console.warn('[LOGO] Logo subido pero no se actualizó el perfil')
    } else {
      console.log('[LOGO] Perfil actualizado con logo_url')
    }
    
    return NextResponse.json({
      success: true,
      logoUrl: logoUrl,
      message: 'Logo subido exitosamente'
    })
    
  } catch (error: any) {
    console.error('[LOGO] Error general:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar logo
export async function DELETE(request: NextRequest) {
  console.log('[LOGO] Iniciando eliminación de logo...')
  
  try {
    // 1. Autenticación usando el cliente SSR estándar
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[LOGO] Usuario no autenticado:', authError?.message)
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    console.log('[LOGO] Usuario autenticado:', user.id)
    
    // 2. Verificar que es inmobiliaria (usando admin client)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.user_type !== 'inmobiliaria') {
      console.error('[LOGO] Usuario no es inmobiliaria')
      return NextResponse.json(
        { error: 'Solo inmobiliarias pueden eliminar logos' },
        { status: 403 }
      )
    }
    
    // 3. Listar archivos del usuario (usando admin client)
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('company-logos')
      .list(user.id)
    
    if (listError) {
      console.error('[LOGO] Error listando archivos:', listError)
      return NextResponse.json(
        { error: 'Error accediendo al storage' },
        { status: 500 }
      )
    }
    
    // 4. Eliminar todos los archivos
    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${user.id}/${f.name}`)
      console.log('[LOGO] Eliminando archivos:', filesToDelete)
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from('company-logos')
        .remove(filesToDelete)
      
      if (deleteError) {
        console.error('[LOGO] Error eliminando archivos:', deleteError)
        return NextResponse.json(
          { error: 'Error eliminando logo' },
          { status: 500 }
        )
      }
      
      console.log('[LOGO] Archivos eliminados exitosamente')
    } else {
      console.log('[LOGO] No hay archivos para eliminar')
    }
    
    // 5. Actualizar tabla users (quitar logo_url) (usando admin client)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        logo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('[LOGO] Error actualizando perfil:', updateError)
      console.warn('[LOGO] Logo eliminado pero no se actualizó el perfil')
    } else {
      console.log('[LOGO] Perfil actualizado (logo_url = null)')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Logo eliminado exitosamente'
    })
    
  } catch (error: any) {
    console.error('[LOGO] Error general:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
