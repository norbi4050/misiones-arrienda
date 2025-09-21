import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos RAW de la base de datos
    const { data: rawProperties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .limit(3)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Hacer request a la API procesada
    const apiResponse = await fetch(`${request.nextUrl.origin}/api/my-properties?limit=3`)
    const apiData = await apiResponse.json()

    return NextResponse.json({
      debug: {
        userId: user.id,
        rawFromDB: rawProperties,
        processedFromAPI: apiData.properties,
        comparison: {
          rawCount: rawProperties?.length || 0,
          processedCount: apiData.properties?.length || 0,
          firstRawImages: rawProperties?.[0]?.images,
          firstRawImagesUrls: rawProperties?.[0]?.images_urls,
          firstProcessedImages: apiData.properties?.[0]?.images,
          firstProcessedCoverUrl: apiData.properties?.[0]?.coverUrl,
          firstProcessedIsPlaceholder: apiData.properties?.[0]?.isPlaceholder
        }
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}
