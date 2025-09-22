import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`🔍 === INVESTIGACIÓN LOGS IMAGENES [${requestId}] ===`)
  
  try {
    // Crear cliente Supabase con Service Role
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log(`🔍 [${requestId}] === INVESTIGANDO /api/properties (LISTADO PÚBLICO) ===`)
    
    // Simular query de /api/properties
    const { data: publicProperties, error: publicError } = await supabase
      .from('properties')
      .select(`
        id, title, price, currency, city, province, property_type,
        bedrooms, bathrooms, area, images, status, is_active,
        created_at, operation_type, images_urls
      `)
      .in('status', ['PUBLISHED', 'AVAILABLE'])
      .eq('is_active', true)
      .limit(3)

    if (publicError) {
      console.error(`🔍 [${requestId}] Error en query público:`, publicError)
    } else {
      console.log(`🔍 [${requestId}] Propiedades públicas encontradas:`, publicProperties?.length || 0)
      
      // LOGS DETALLADOS POR ITEM - LISTADO PÚBLICO
      publicProperties?.forEach((property: any) => {
        console.log(`🔍 [PÚBLICO] property.id: ${property.id}`)
        console.log(`🔍 [PÚBLICO] Array.isArray(property.images_urls): ${Array.isArray(property.images_urls)}`)
        console.log(`🔍 [PÚBLICO] property.images_urls:`, property.images_urls)
        console.log(`🔍 [PÚBLICO] property.images:`, property.images)
        console.log(`🔍 [PÚBLICO] ==========================================`)
      })
    }

    console.log(`🔍 [${requestId}] === INVESTIGANDO /api/my-properties (MIS PUBLICACIONES) ===`)
    
    // Simular query de /api/my-properties (requiere user_id)
    const { data: myProperties, error: myError } = await supabase
      .from('properties')
      .select(`
        id, title, description, price, currency, city, province, address,
        property_type, bedrooms, bathrooms, garages, area, lot_area,
        images_urls, images, status, is_active,
        amenities, features, year_built, floor, total_floors,
        created_at, updated_at, expires_at, operation_type
      `)
      .eq('user_id', '6403f9d2-e846-4c70-87e0-e051127d9500') // Usuario específico
      .limit(3)

    if (myError) {
      console.error(`🔍 [${requestId}] Error en query mis propiedades:`, myError)
    } else {
      console.log(`🔍 [${requestId}] Mis propiedades encontradas:`, myProperties?.length || 0)
      
      // LOGS DETALLADOS POR ITEM - MIS PUBLICACIONES
      myProperties?.forEach((property: any) => {
        console.log(`🔍 [MIS-PROPS] property.id: ${property.id}`)
        console.log(`🔍 [MIS-PROPS] Array.isArray(property.images_urls): ${Array.isArray(property.images_urls)}`)
        console.log(`🔍 [MIS-PROPS] property.images_urls:`, property.images_urls)
        console.log(`🔍 [MIS-PROPS] property.images:`, property.images)
        console.log(`🔍 [MIS-PROPS] ==========================================`)
      })
    }

    // Análisis de campos de salida de cada API
    const publicApiOutput = publicProperties?.[0] ? {
      hasImages: !!publicProperties[0].images,
      hasCoverUrl: false, // Se genera en mapPropertyToResponse
      hasImagesUrls: !!publicProperties[0].images_urls,
      imagesType: typeof publicProperties[0].images,
      imagesUrlsType: typeof publicProperties[0].images_urls,
      imagesUrlsIsArray: Array.isArray(publicProperties[0].images_urls)
    } : null

    const myPropsApiOutput = myProperties?.[0] ? {
      hasImages: !!myProperties[0].images,
      hasCoverUrl: false, // Se genera en procesamiento
      hasImagesUrls: !!myProperties[0].images_urls,
      imagesType: typeof myProperties[0].images,
      imagesUrlsType: typeof myProperties[0].images_urls,
      imagesUrlsIsArray: Array.isArray(myProperties[0].images_urls)
    } : null

    return NextResponse.json({
      investigacion: {
        timestamp: new Date().toISOString(),
        requestId,
        apis: {
          '/api/properties': {
            descripcion: 'Listado público de propiedades',
            query: 'status IN (PUBLISHED, AVAILABLE) AND is_active = true',
            propiedades_encontradas: publicProperties?.length || 0,
            campos_salida_raw: publicApiOutput,
            error: publicError?.message || null
          },
          '/api/my-properties': {
            descripcion: 'Mis publicaciones (requiere auth)',
            query: 'user_id = específico',
            propiedades_encontradas: myProperties?.length || 0,
            campos_salida_raw: myPropsApiOutput,
            error: myError?.message || null
          }
        },
        datos_db: {
          total_propiedades_publicas: publicProperties?.length || 0,
          total_mis_propiedades: myProperties?.length || 0,
          usuario_investigado: '6403f9d2-e846-4c70-87e0-e051127d9500'
        }
      }
    })

  } catch (error) {
    console.error(`🔍 [${requestId}] Error general en investigación:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      error: 'Error en investigación',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
