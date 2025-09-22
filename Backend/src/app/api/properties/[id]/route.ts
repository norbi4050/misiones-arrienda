import { NextRequest, NextResponse } from 'next/server'
import { generateSignedUrls, extractStorageKeys } from '@/lib/signed-urls'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/properties/[id] [${requestId}] ===`)
  
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de propiedad requerido' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Buscando propiedad:`, id)

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

    // Buscar propiedad con todos los campos necesarios (incluyendo ambos campos de imágenes)
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        id, title, description, price, currency, city, province, address,
        property_type, bedrooms, bathrooms, garages, area, lot_area,
        images_urls, images, status, is_active,
        amenities, features, year_built, floor, total_floors,
        created_at, updated_at, expires_at
      `)
      .eq('id', id)
      .in('status', ['PUBLISHED', 'AVAILABLE'])  // Propiedades publicadas o disponibles
      .eq('is_active', true)                     // Solo propiedades activas
      .single()

    if (error) {
      console.error(`[${requestId}] Error buscando propiedad:`, error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Propiedad no encontrada o no disponible' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Error al buscar la propiedad' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Propiedad encontrada:`, property.title)

    // Procesar imágenes con manejo robusto de arrays PostgreSQL
    let imageUrls = []
    
    // Intentar primero images_urls (nuevo) - manejar tanto arrays como JSON
    if (property.images_urls) {
      try {
        // Si ya es un array (PostgreSQL text[]), usarlo directamente
        if (Array.isArray(property.images_urls)) {
          imageUrls = property.images_urls
          console.log(`[${requestId}] Imágenes encontradas en images_urls (array PostgreSQL):`, imageUrls.length)
        } else {
          // Si es string, intentar parsear como JSON
          const parsed = JSON.parse(property.images_urls)
          imageUrls = Array.isArray(parsed) ? parsed : []
          console.log(`[${requestId}] Imágenes encontradas en images_urls (JSON):`, imageUrls.length)
        }
      } catch (e) {
        console.log(`[${requestId}] Error parseando images_urls:`, e)
        console.log(`[${requestId}] Tipo de images_urls:`, typeof property.images_urls)
        console.log(`[${requestId}] Contenido:`, property.images_urls)
      }
    }
    
    // Fallback a images (legacy) si images_urls está vacío
    if (imageUrls.length === 0 && property.images) {
      try {
        const parsed = JSON.parse(property.images)
        imageUrls = Array.isArray(parsed) ? parsed : []
        console.log(`[${requestId}] Imágenes encontradas en images (legacy):`, imageUrls.length)
      } catch (e) {
        console.log(`[${requestId}] Error parseando images legacy:`, e)
      }
    }
    
    // Si aún no hay imágenes, usar placeholder
    if (imageUrls.length === 0) {
      console.log(`[${requestId}] No se encontraron imágenes, usando placeholder`)
      imageUrls = ['/placeholder-house-1.jpg']
    }
    console.log(`[${requestId}] URLs de imágenes procesadas:`, imageUrls.length)

    // Mapear a formato de respuesta
    const response = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      currency: property.currency || 'ARS',
      city: property.city,
      province: property.province,
      address: property.address,
      propertyType: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      garages: property.garages || 0,
      area: property.area,
      lotArea: property.lot_area,
      status: property.status,
      isActive: property.is_active,
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      features: property.features ? JSON.parse(property.features) : [],
      yearBuilt: property.year_built,
      floor: property.floor,
      totalFloors: property.total_floors,
      
      // Información de contacto (campos no disponibles en DB actual)
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      
      // Fechas
      createdAt: property.created_at,
      updatedAt: property.updated_at,
      expiresAt: property.expires_at,
      
      // Imágenes convertidas a URLs públicas completas
      images: imageUrls.map((url: string) => {
        // Si ya es una URL completa, devolverla tal como está
        if (url.startsWith('http') || url.startsWith('/')) {
          return url
        }
        // Si es una key de storage, convertir a URL pública
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        return `${supabaseUrl}/storage/v1/object/public/property-images/${url}`
      }),
      imagesSigned: imageUrls.map((url: string, index: number) => {
        // Convertir key a URL pública completa para imagesSigned también
        const fullUrl = url.startsWith('http') || url.startsWith('/') 
          ? url 
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${url}`
        
        return {
          url: fullUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas desde ahora
          key: `image-${index}`
        }
      }),
      imagesCount: imageUrls.length,
      signedUrlsGenerated: imageUrls.length,
      signedUrlsErrors: 0,
      
      // NO exponer user_id por seguridad
    }

    console.log(`[${requestId}] URLs de imágenes procesadas:`, imageUrls.length)

    return NextResponse.json(response)

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

// PATCH /api/properties/[id] - Actualizar propiedad existente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== PATCH /api/properties/[id] [${requestId}] ===`)

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de propiedad requerido' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Actualizando propiedad:`, id)

    // Crear cliente Supabase con autenticación
    const { createClient } = await import('@/lib/supabase/server')
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

    console.log(`[${requestId}] Usuario autenticado:`, user.id)

    // Verificar que la propiedad existe y pertenece al usuario
    const { data: existingProperty, error: checkError } = await supabase
      .from('properties')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (checkError || !existingProperty) {
      console.error(`[${requestId}] Propiedad no encontrada:`, checkError)
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el usuario es el propietario
    if (existingProperty.user_id !== user.id) {
      console.log(`[${requestId}] Usuario no es propietario`)
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta propiedad' },
        { status: 403 }
      )
    }

    // Parsear datos del cuerpo de la petición
    const body = await request.json()
    console.log(`[${requestId}] Datos recibidos:`, Object.keys(body))

    // Validar y preparar datos para actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Campos editables básicos
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.city !== undefined) updateData.city = body.city
    if (body.province !== undefined) updateData.province = body.province
    if (body.address !== undefined) updateData.address = body.address
    if (body.propertyType !== undefined) updateData.property_type = body.propertyType
    if (body.operationType !== undefined) updateData.operation_type = body.operationType

    // Campos numéricos
    if (body.bedrooms !== undefined) updateData.bedrooms = parseInt(body.bedrooms)
    if (body.bathrooms !== undefined) updateData.bathrooms = parseInt(body.bathrooms)
    if (body.garages !== undefined) updateData.garages = parseInt(body.garages)
    if (body.area !== undefined) updateData.area = parseFloat(body.area)
    if (body.lotArea !== undefined) updateData.lot_area = parseFloat(body.lotArea)
    if (body.yearBuilt !== undefined) updateData.year_built = parseInt(body.yearBuilt)
    if (body.floor !== undefined) updateData.floor = parseInt(body.floor)
    if (body.totalFloors !== undefined) updateData.total_floors = parseInt(body.totalFloors)

    // Arrays JSON
    if (body.amenities !== undefined) updateData.amenities = JSON.stringify(body.amenities)
    if (body.features !== undefined) updateData.features = JSON.stringify(body.features)
    if (body.images !== undefined) updateData.images_urls = JSON.stringify(body.images)

    console.log(`[${requestId}] Campos a actualizar:`, Object.keys(updateData))

    // Ejecutar actualización
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, title, description, price, currency, city, province, address,
        property_type, operation_type, bedrooms, bathrooms, garages, area, lot_area,
        images_urls, images, status, is_active,
        amenities, features, year_built, floor, total_floors,
        created_at, updated_at, expires_at
      `)
      .single()

    if (updateError) {
      console.error(`[${requestId}] Error actualizando propiedad:`, updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la propiedad' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Propiedad actualizada exitosamente`)

    // Procesar imágenes para respuesta
    let imageUrls = []
    if (updatedProperty.images_urls) {
      try {
        const parsed = JSON.parse(updatedProperty.images_urls)
        imageUrls = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.log(`[${requestId}] Error parseando images_urls`)
      }
    }

    if (imageUrls.length === 0 && updatedProperty.images) {
      try {
        const parsed = JSON.parse(updatedProperty.images)
        imageUrls = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.log(`[${requestId}] Error parseando images legacy`)
      }
    }

    if (imageUrls.length === 0) {
      imageUrls = ['/placeholder-house-1.jpg']
    }

    // Mapear respuesta
    const response = {
      id: updatedProperty.id,
      title: updatedProperty.title,
      description: updatedProperty.description,
      price: updatedProperty.price,
      currency: updatedProperty.currency || 'ARS',
      city: updatedProperty.city,
      province: updatedProperty.province,
      address: updatedProperty.address,
      propertyType: updatedProperty.property_type,
      operationType: updatedProperty.operation_type,
      bedrooms: updatedProperty.bedrooms,
      bathrooms: updatedProperty.bathrooms,
      garages: updatedProperty.garages || 0,
      area: updatedProperty.area,
      lotArea: updatedProperty.lot_area,
      status: updatedProperty.status,
      isActive: updatedProperty.is_active,
      amenities: updatedProperty.amenities ? JSON.parse(updatedProperty.amenities) : [],
      features: updatedProperty.features ? JSON.parse(updatedProperty.features) : [],
      yearBuilt: updatedProperty.year_built,
      floor: updatedProperty.floor,
      totalFloors: updatedProperty.total_floors,
      createdAt: updatedProperty.created_at,
      updatedAt: updatedProperty.updated_at,
      expiresAt: updatedProperty.expires_at,
      images: imageUrls,
      imagesCount: imageUrls.length
    }

    return NextResponse.json({
      success: true,
      message: 'Propiedad actualizada exitosamente',
      property: response
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
