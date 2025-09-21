import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== DEBUG API COMPARISON [${requestId}] ===`)

  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] Usuario autenticado:`, user.id)

    // 1. Llamar a /api/properties (página pública)
    const propertiesResponse = await fetch(`${request.nextUrl.origin}/api/properties`, {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    })
    const propertiesData = await propertiesResponse.json()

    // 2. Llamar a /api/my-properties (página privada)
    const myPropertiesResponse = await fetch(`${request.nextUrl.origin}/api/my-properties`, {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    })
    const myPropertiesData = await myPropertiesResponse.json()

    // 3. Comparar las respuestas
    const comparison = {
      timestamp: new Date().toISOString(),
      user_id: user.id,
      
      // Datos de /api/properties
      public_api: {
        status: propertiesResponse.status,
        count: propertiesData.count || 0,
        items_count: propertiesData.items?.length || 0,
        first_item: propertiesData.items?.[0] ? {
          id: propertiesData.items[0].id,
          title: propertiesData.items[0].title,
          images: propertiesData.items[0].images,
          coverUrl: propertiesData.items[0].coverUrl,
          isPlaceholder: propertiesData.items[0].isPlaceholder,
          status: propertiesData.items[0].status
        } : null
      },
      
      // Datos de /api/my-properties
      private_api: {
        status: myPropertiesResponse.status,
        total: myPropertiesData.pagination?.total || 0,
        properties_count: myPropertiesData.properties?.length || 0,
        first_property: myPropertiesData.properties?.[0] ? {
          id: myPropertiesData.properties[0].id,
          title: myPropertiesData.properties[0].title,
          images: myPropertiesData.properties[0].images,
          coverUrl: myPropertiesData.properties[0].coverUrl,
          isPlaceholder: myPropertiesData.properties[0].isPlaceholder,
          status: myPropertiesData.properties[0].status
        } : null
      }
    }

    // 4. Análisis de discrepancias
    const analysis = {
      same_count: comparison.public_api.count === comparison.private_api.total,
      both_have_data: comparison.public_api.items_count > 0 && comparison.private_api.properties_count > 0,
      image_urls_match: false,
      cover_urls_match: false,
      placeholder_status_match: false
    }

    if (comparison.public_api.first_item && comparison.private_api.first_property) {
      analysis.image_urls_match = JSON.stringify(comparison.public_api.first_item.images) === 
                                  JSON.stringify(comparison.private_api.first_property.images)
      analysis.cover_urls_match = comparison.public_api.first_item.coverUrl === 
                                 comparison.private_api.first_property.coverUrl
      analysis.placeholder_status_match = comparison.public_api.first_item.isPlaceholder === 
                                         comparison.private_api.first_property.isPlaceholder
    }

    // 5. Consulta directa a la base de datos para verificar
    const { data: rawProperties, error: dbError } = await supabase
      .from('properties')
      .select('id, title, images, images_urls, status, user_id')
      .eq('user_id', user.id)
      .limit(3)

    const database_raw = {
      error: dbError?.message || null,
      count: rawProperties?.length || 0,
      properties: rawProperties?.map(p => ({
        id: p.id,
        title: p.title,
        images_field: p.images,
        images_urls_field: p.images_urls,
        status: p.status,
        user_id: p.user_id
      })) || []
    }

    return NextResponse.json({
      comparison,
      analysis,
      database_raw,
      
      // Diagnóstico
      diagnosis: {
        issue_detected: !analysis.image_urls_match || !analysis.cover_urls_match,
        possible_causes: [
          !analysis.same_count && "Diferentes filtros entre APIs (PUBLISHED vs ALL)",
          !analysis.image_urls_match && "Diferente procesamiento de imágenes",
          !analysis.cover_urls_match && "Diferentes signed URLs generadas",
          !analysis.placeholder_status_match && "Diferente lógica de fallback a placeholder"
        ].filter(Boolean)
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error:`, error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    }, { status: 500 })
  }
}
