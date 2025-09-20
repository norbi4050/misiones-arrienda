import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/debug-images [${requestId}] ===`)
  
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

    // Obtener datos de imágenes de la propiedad
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, title, images_urls, images')
      .eq('status', 'PUBLISHED')
      .eq('is_active', true)

    if (error) {
      console.error('Error obteniendo propiedades:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const analysis = properties?.map(property => {
      let imagesUrlsAnalysis = null
      let imagesAnalysis = null

      // Analizar images_urls
      if (property.images_urls) {
        try {
          const parsed = JSON.parse(property.images_urls)
          imagesUrlsAnalysis = {
            type: 'valid_json',
            length: Array.isArray(parsed) ? parsed.length : 'not_array',
            sample: Array.isArray(parsed) ? parsed.slice(0, 2) : parsed,
            raw_length: property.images_urls.length
          }
        } catch (e) {
          imagesUrlsAnalysis = {
            type: 'invalid_json',
            raw_length: property.images_urls.length,
            first_100_chars: property.images_urls.substring(0, 100),
            is_all_same_char: property.images_urls.split('').every((char: string) => char === property.images_urls[0])
          }
        }
      }

      // Analizar images (campo legacy)
      if (property.images) {
        try {
          const parsed = JSON.parse(property.images)
          imagesAnalysis = {
            type: 'valid_json',
            length: Array.isArray(parsed) ? parsed.length : 'not_array',
            sample: Array.isArray(parsed) ? parsed.slice(0, 2) : parsed
          }
        } catch (e) {
          imagesAnalysis = {
            type: 'invalid_json',
            raw_length: property.images.length,
            first_100_chars: property.images.substring(0, 100)
          }
        }
      }

      return {
        id: property.id,
        title: property.title,
        images_urls_analysis: imagesUrlsAnalysis,
        images_analysis: imagesAnalysis
      }
    })

    return NextResponse.json({
      total_properties: properties?.length || 0,
      analysis,
      recommendations: [
        'Si images_urls contiene datos corruptos, necesita ser limpiado',
        'Verificar el proceso de carga de imágenes',
        'Considerar usar URLs de placeholder mientras se arregla'
      ]
    })

  } catch (error) {
    console.error('Error en debug-images:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
