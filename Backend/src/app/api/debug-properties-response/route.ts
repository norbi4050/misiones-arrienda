import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('[DEBUG PROPERTIES] Iniciando investigación...')
    
    // 1. Verificar conexión a Supabase
    const supabase = createClient()
    
    // 2. Verificar si hay propiedades en la DB
    const { data: allProperties, error: allError, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .limit(5)
    
    console.log('[DEBUG PROPERTIES] Query result:', { 
      count, 
      error: allError, 
      propertiesFound: allProperties?.length || 0 
    })
    
    // 3. Verificar propiedades publicadas específicamente
    const { data: publishedProperties, error: pubError } = await supabase
      .from('properties')
      .select('id, title, status, is_active, images, images_urls, user_id, property_type, propertyType')
      .eq('status', 'PUBLISHED')
      .eq('is_active', true)
      .limit(3)
    
    console.log('[DEBUG PROPERTIES] Published properties:', { 
      count: publishedProperties?.length || 0, 
      error: pubError,
      properties: publishedProperties 
    })
    
    // 4. Simular llamada a /api/properties
    let apiResponse = null
    let apiError = null
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/properties`, {
        cache: 'no-store'
      })
      
      if (res.ok) {
        apiResponse = await res.json()
      } else {
        apiError = `HTTP ${res.status}: ${res.statusText}`
      }
    } catch (e: any) {
      apiError = e.message
    }
    
    // 5. Verificar función getPropertyImages si existe
    let getPropertyImagesExists = false
    let getPropertyImagesError = null
    
    try {
      const { getPropertyImages } = await import('@/lib/property-images.server')
      getPropertyImagesExists = true
      
      // Probar con una propiedad si existe
      if (publishedProperties && publishedProperties.length > 0) {
        const testProperty = publishedProperties[0]
        const testImages = await getPropertyImages({
          propertyId: testProperty.id,
          userId: testProperty.user_id,
          fallbackImages: [],
          maxImages: 3
        })
        console.log('[DEBUG PROPERTIES] Test getPropertyImages:', { 
          propertyId: testProperty.id, 
          imagesFound: testImages.length,
          images: testImages 
        })
      }
    } catch (e: any) {
      getPropertyImagesError = e.message
    }
    
    // 6. Verificar variables de entorno relevantes
    const envVars = {
      NEXT_PUBLIC_USE_MOCK_PROPERTIES: process.env.NEXT_PUBLIC_USE_MOCK_PROPERTIES,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET'
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      investigation: {
        supabaseConnection: {
          totalProperties: count,
          allPropertiesError: allError,
          publishedProperties: publishedProperties?.length || 0,
          publishedError: pubError,
          sampleProperties: publishedProperties?.slice(0, 2) || []
        },
        apiEndpoint: {
          response: apiResponse,
          error: apiError,
          dataSource: apiResponse?.meta?.dataSource || 'unknown'
        },
        propertyImagesFunction: {
          exists: getPropertyImagesExists,
          error: getPropertyImagesError
        },
        environment: envVars,
        analysis: {
          usingMockData: apiResponse?.meta?.dataSource === 'mock',
          hasRealProperties: (publishedProperties?.length || 0) > 0,
          apiWorking: !apiError && apiResponse?.properties
        }
      }
    })
    
  } catch (error: any) {
    console.error('[DEBUG PROPERTIES] Error:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
