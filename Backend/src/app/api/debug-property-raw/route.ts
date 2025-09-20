import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const propertyId = url.searchParams.get('id') || '89ecf166-8f87-4174-a0d4-42052166f2dd'

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

    // Obtener datos RAW de la propiedad
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, title, images_urls, images, status, is_active')
      .eq('id', propertyId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Analizar images_urls
    let imagesUrlsAnalysis = null
    if (property.images_urls) {
      const rawLength = property.images_urls.length
      const first100 = property.images_urls.substring(0, 100)
      const isAllSameChar = property.images_urls.split('').every((char: string) => char === property.images_urls[0])
      
      try {
        const parsed = JSON.parse(property.images_urls)
        imagesUrlsAnalysis = {
          type: 'valid_json',
          raw_length: rawLength,
          parsed_type: Array.isArray(parsed) ? 'array' : typeof parsed,
          parsed_length: Array.isArray(parsed) ? parsed.length : 'not_array',
          sample: Array.isArray(parsed) ? parsed.slice(0, 3) : parsed,
          is_corrupted: isAllSameChar && rawLength > 100
        }
      } catch (e) {
        imagesUrlsAnalysis = {
          type: 'invalid_json',
          raw_length: rawLength,
          first_100_chars: first100,
          is_all_same_char: isAllSameChar,
          is_corrupted: isAllSameChar && rawLength > 100
        }
      }
    }

    // Analizar images (legacy)
    let imagesAnalysis = null
    if (property.images) {
      try {
        const parsed = JSON.parse(property.images)
        imagesAnalysis = {
          type: 'valid_json',
          parsed_type: Array.isArray(parsed) ? 'array' : typeof parsed,
          parsed_length: Array.isArray(parsed) ? parsed.length : 'not_array',
          sample: Array.isArray(parsed) ? parsed.slice(0, 3) : parsed
        }
      } catch (e) {
        imagesAnalysis = {
          type: 'invalid_json',
          raw_length: property.images.length,
          first_100_chars: property.images.substring(0, 100)
        }
      }
    }

    return NextResponse.json({
      property_id: property.id,
      title: property.title,
      status: property.status,
      is_active: property.is_active,
      images_urls_analysis: imagesUrlsAnalysis,
      images_analysis: imagesAnalysis,
      recommendation: imagesUrlsAnalysis?.is_corrupted 
        ? 'Datos corruptos detectados - usar placeholder'
        : 'Datos válidos - mostrar imágenes originales'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
