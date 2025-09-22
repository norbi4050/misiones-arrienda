import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/diagnostico-imagenes-supabase [${requestId}] ===`)

  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log(`[${requestId}] Usuario no autenticado`)
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] Ejecutando diagnóstico para usuario:`, user.id)

    const diagnostico: any = {
      usuario_id: user.id,
      timestamp: new Date().toISOString(),
      secciones: {}
    }

    // 1. Verificar propiedades del usuario actual
    const { data: propiedades, error: propError } = await supabase
      .from('properties')
      .select(`
        id, title, status, images, images_urls, created_at, updated_at
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (propError) {
      console.error(`[${requestId}] Error obteniendo propiedades:`, propError)
    } else {
      diagnostico.secciones.propiedades = propiedades?.map(prop => ({
        id: prop.id,
        title: prop.title,
        status: prop.status,
        images_preview: prop.images ? prop.images.substring(0, 100) : null,
        images_type: prop.images?.includes('data:image') ? 'BASE64_DATA_URI' :
                    prop.images?.includes('supabase') ? 'SUPABASE_URL' :
                    prop.images?.includes('placeholder') ? 'PLACEHOLDER' :
                    (!prop.images || prop.images === '[]') ? 'EMPTY' : 'OTHER',
        images_urls_count: Array.isArray(prop.images_urls) ? prop.images_urls.length : 0,
        first_image_url: Array.isArray(prop.images_urls) && prop.images_urls.length > 0 ? prop.images_urls[0] : null,
        created_at: prop.created_at,
        updated_at: prop.updated_at
      })) || []
    }

    // 2. Verificar archivos en bucket property-images
    const { data: archivos, error: storageError } = await supabase
      .storage
      .from('property-images')
      .list(user.id, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (storageError) {
      console.error(`[${requestId}] Error listando archivos storage:`, storageError)
      diagnostico.secciones.storage_error = storageError.message
    } else {
      diagnostico.secciones.archivos_storage = archivos?.map(archivo => ({
        name: archivo.name,
        size: archivo.metadata?.size,
        mimetype: archivo.metadata?.mimetype,
        created_at: archivo.created_at,
        updated_at: archivo.updated_at
      })) || []
    }

    // 3. Verificar buckets disponibles
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()

    if (bucketsError) {
      console.error(`[${requestId}] Error listando buckets:`, bucketsError)
      diagnostico.secciones.buckets_error = bucketsError.message
    } else {
      diagnostico.secciones.buckets = buckets?.map(bucket => ({
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        created_at: bucket.created_at,
        updated_at: bucket.updated_at
      })) || []
    }

    // 4. Análisis de discrepancias
    const analisis = {
      total_propiedades: propiedades?.length || 0,
      con_base64: propiedades?.filter(p => p.images?.includes('data:image')).length || 0,
      con_storage_urls: propiedades?.filter(p => Array.isArray(p.images_urls) && p.images_urls.length > 0).length || 0,
      sin_imagenes: propiedades?.filter(p => !p.images || p.images === '[]').length || 0,
      archivos_en_storage: archivos?.length || 0
    }

    diagnostico.secciones.analisis = analisis

    // 5. Recomendaciones específicas
    const recomendaciones = []
    
    if (analisis.con_base64 > 0) {
      recomendaciones.push({
        problema: `${analisis.con_base64} propiedades tienen imágenes como data URIs base64`,
        solucion: 'Migrar estas imágenes a Supabase Storage',
        prioridad: 'ALTA'
      })
    }

    if (analisis.con_storage_urls === 0 && analisis.archivos_en_storage > 0) {
      recomendaciones.push({
        problema: 'Hay archivos en storage pero no están referenciados en images_urls',
        solucion: 'Actualizar campo images_urls con las keys correctas',
        prioridad: 'ALTA'
      })
    }

    if (analisis.sin_imagenes > 0) {
      recomendaciones.push({
        problema: `${analisis.sin_imagenes} propiedades sin imágenes`,
        solucion: 'Mostrar estado "Sin imágenes" en lugar de placeholders',
        prioridad: 'MEDIA'
      })
    }

    diagnostico.secciones.recomendaciones = recomendaciones

    console.log(`[${requestId}] Diagnóstico completado:`, {
      propiedades: analisis.total_propiedades,
      con_base64: analisis.con_base64,
      archivos_storage: analisis.archivos_en_storage
    })

    return NextResponse.json({
      success: true,
      diagnostico
    })

  } catch (error) {
    console.error(`[${requestId}] Error en diagnóstico:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
