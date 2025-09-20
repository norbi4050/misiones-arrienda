import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const propertyId = '89ecf166-8f87-4174-a0d4-42052166f2dd'

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

    // Obtener TODOS los campos relacionados con imágenes
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, title, images, images_urls, cover_image_key, images_count')
      .eq('id', propertyId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Analizar cada campo
    const analysis = {
      property_id: property.id,
      title: property.title,
      fields_analysis: {
        images: {
          exists: !!property.images,
          type: typeof property.images,
          length: property.images ? property.images.length : 0,
          is_json: property.images ? (() => {
            try { JSON.parse(property.images); return true } catch { return false }
          })() : false,
          sample: property.images ? property.images.substring(0, 100) + '...' : null
        },
        images_urls: {
          exists: !!property.images_urls,
          type: typeof property.images_urls,
          length: property.images_urls ? property.images_urls.length : 0,
          is_json: property.images_urls ? (() => {
            try { JSON.parse(property.images_urls); return true } catch { return false }
          })() : false,
          sample: property.images_urls ? property.images_urls.substring(0, 100) + '...' : null
        },
        cover_image_key: {
          exists: !!property.cover_image_key,
          value: property.cover_image_key
        },
        images_count: {
          exists: !!property.images_count,
          value: property.images_count
        }
      },
      recommendation: property.images && !property.images_urls ? 
        'Usar campo "images" (legacy) en lugar de "images_urls"' :
        property.images_urls ? 'Usar campo "images_urls"' : 'No hay imágenes disponibles'
    }

    return NextResponse.json(analysis)

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
