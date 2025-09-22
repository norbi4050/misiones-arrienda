import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== POST /api/fix-images-json-admin [${requestId}] ===`)

  try {
    // Crear cliente admin con Service Role
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

    console.log(`[${requestId}] Cliente admin creado`)

    // PASO 1: Verificar el contenido actual de images_urls
    const { data: properties, error: selectError } = await supabase
      .from('properties')
      .select('id, title, images_urls')
      .eq('id', '89ecf166-8f87-4174-a0d4-42052166f2dd')

    if (selectError) {
      console.error(`[${requestId}] Error consultando propiedad:`, selectError)
      return NextResponse.json(
        { error: 'Error consultando propiedad', details: selectError },
        { status: 500 }
      )
    }

    if (!properties || properties.length === 0) {
      console.log(`[${requestId}] Propiedad no encontrada`)
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const property = properties[0]
    console.log(`[${requestId}] Propiedad encontrada:`, property.title)
    console.log(`[${requestId}] images_urls actual:`, property.images_urls)
    console.log(`[${requestId}] Tipo de images_urls:`, typeof property.images_urls)

    // PASO 2: Verificar si el archivo existe en storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('property-images')
      .list('6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714')

    if (storageError) {
      console.error(`[${requestId}] Error consultando storage:`, storageError)
    } else {
      console.log(`[${requestId}] Archivos en storage:`, storageFiles?.map(f => f.name))
    }

    // PASO 3: Corregir el formato JSON
    const correctImageUrl = '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg'
    
    console.log(`[${requestId}] Actualizando images_urls con:`, [correctImageUrl])

    const { data: updateData, error: updateError } = await supabase
      .from('properties')
      .update({
        images_urls: [correctImageUrl]
      })
      .eq('id', '89ecf166-8f87-4174-a0d4-42052166f2dd')
      .select()

    if (updateError) {
      console.error(`[${requestId}] Error actualizando propiedad:`, updateError)
      return NextResponse.json(
        { error: 'Error actualizando propiedad', details: updateError },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Propiedad actualizada exitosamente:`, updateData)

    // PASO 4: Verificar la corrección
    const { data: verifyData, error: verifyError } = await supabase
      .from('properties')
      .select('id, title, images_urls')
      .eq('id', '89ecf166-8f87-4174-a0d4-42052166f2dd')

    if (verifyError) {
      console.error(`[${requestId}] Error verificando corrección:`, verifyError)
    } else {
      console.log(`[${requestId}] Verificación post-corrección:`, verifyData?.[0])
    }

    // PASO 5: Generar URL pública directa
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${correctImageUrl}`

    return NextResponse.json({
      success: true,
      message: 'JSON corregido exitosamente',
      data: {
        propertyId: '89ecf166-8f87-4174-a0d4-42052166f2dd',
        title: property.title,
        oldImagesUrls: property.images_urls,
        newImagesUrls: [correctImageUrl],
        publicUrl: publicUrl,
        storageFiles: storageFiles?.map(f => f.name) || [],
        verification: verifyData?.[0]
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
