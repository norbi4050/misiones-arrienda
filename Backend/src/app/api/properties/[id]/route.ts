import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema específico para edición de propiedades
const editPropertySchema = z.object({
  title: z.string().min(3, 'Título muy corto').max(140, 'Título muy largo')
    .transform(s => s.trim().replace(/\s+/g, ' ').replace(/[<>]/g, '')),
  description: z.string().min(10, 'Descripción muy corta').max(2000, 'Descripción muy larga'),
  price: z.number().min(0, 'Precio debe ser positivo'),
  currency: z.string().optional().default('ARS'),
  city: z.string().min(1, 'Ciudad requerida'),
  province: z.string().min(1, 'Provincia requerida'),
  address: z.string().optional(),
  property_type: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO']),
  operation_type: z.enum(['RENT', 'SALE']),
  bedrooms: z.number().min(0, 'Dormitorios no pueden ser negativos'),
  bathrooms: z.number().min(0, 'Baños no pueden ser negativos'),
  area: z.number().min(0, 'Área debe ser positiva'),
  images_urls: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional()
}).partial()

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

    // Crear cliente Supabase con autenticación (opcional para visitantes)
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Verificar autenticación (puede ser null para visitantes)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log(`[${requestId}] Usuario:`, user?.id || 'no autenticado')

    // Buscar propiedad sin filtros iniciales
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        id, title, description, price, currency, city, province, address,
        property_type, operation_type, bedrooms, bathrooms, garages, area, lot_area,
        images_urls, images, status, is_active, user_id,
        amenities, features, year_built, floor, total_floors,
        created_at, updated_at, expires_at
      `)
      .eq('id', id)
      .maybeSingle()

    if (error || !property) {
      console.error(`[${requestId}] Error buscando propiedad:`, error)
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    console.log(`[${requestId}] Propiedad encontrada:`, property.title)

    // Verificar ownership
    const isOwner = user && property.user_id === user.id
    console.log(`[${requestId}] Es dueño:`, isOwner)

    // Si NO es el dueño, verificar que sea pública
    if (!isOwner) {
      const isPublic = (property.status === 'PUBLISHED' || property.status === 'AVAILABLE') && property.is_active
      if (!isPublic) {
        console.log(`[${requestId}] Propiedad no pública para visitante`)
        return NextResponse.json(
          { error: 'Propiedad no encontrada' },
          { status: 404 }
        )
      }
    }

    // Procesar imágenes
    let imageUrls = []
    let imageKeys = []
    
    // Intentar primero images_urls (nuevo)
    if (property.images_urls) {
      try {
        if (Array.isArray(property.images_urls)) {
          imageKeys = property.images_urls
        } else {
          const parsed = JSON.parse(property.images_urls)
          imageKeys = Array.isArray(parsed) ? parsed : []
        }
        console.log(`[${requestId}] Keys encontradas en images_urls:`, imageKeys.length)
      } catch (e) {
        console.log(`[${requestId}] Error parseando images_urls:`, e)
      }
    }
    
    // Fallback a images (legacy) si images_urls está vacío
    if (imageKeys.length === 0 && property.images) {
      try {
        const parsed = JSON.parse(property.images)
        imageKeys = Array.isArray(parsed) ? parsed : []
        console.log(`[${requestId}] Keys encontradas en images (legacy):`, imageKeys.length)
      } catch (e) {
        console.log(`[${requestId}] Error parseando images legacy:`, e)
      }
    }

    // Convertir keys a URLs públicas absolutas
    imageUrls = imageKeys.map((key: string) => {
      if (key.startsWith('http') || key.startsWith('/')) {
        return key
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${key}`
    })

    console.log(`[${requestId}] URLs de imágenes procesadas:`, imageUrls.length)

    // Campos públicos (para visitantes y dueños)
    const publicResponse = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      currency: property.currency || 'ARS',
      city: property.city,
      province: property.province,
      address: property.address,
      propertyType: property.property_type,
      operationType: property.operation_type,
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
      createdAt: property.created_at,
      updatedAt: property.updated_at,
      expiresAt: property.expires_at,
      
      // Imágenes: URLs absolutas para preview
      images: imageUrls,
      imagesCount: imageUrls.length
    }

    // Si es el dueño, agregar campos adicionales para edición
    if (isOwner) {
      return NextResponse.json({
        ...publicResponse,
        // Keys para el uploader (solo para dueños)
        images_urls: imageKeys,
        // Campos adicionales para edición
        isOwner: true
      })
    }

    // Para visitantes, solo campos públicos
    return NextResponse.json(publicResponse)

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
      .eq('user_id', user.id)  // Validación de ownership
      .single()

    if (checkError || !existingProperty) {
      console.error(`[${requestId}] Propiedad no encontrada:`, checkError)
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes permisos para editarla' },
        { status: 404 }
      )
    }

    // Parsear y validar datos del cuerpo de la petición
    const body = await request.json()
    console.log(`[${requestId}] Datos recibidos:`, Object.keys(body))

    // Validar con Zod schema
    const validationResult = editPropertySchema.safeParse(body)
    if (!validationResult.success) {
      console.error(`[${requestId}] Errores de validación:`, validationResult.error.errors)
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Preparar datos para actualización en base de datos
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Mapear campos validados a campos de base de datos
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.currency !== undefined) updateData.currency = validatedData.currency
    if (validatedData.city !== undefined) updateData.city = validatedData.city
    if (validatedData.province !== undefined) updateData.province = validatedData.province
    if (validatedData.address !== undefined) updateData.address = validatedData.address
    if (validatedData.property_type !== undefined) updateData.property_type = validatedData.property_type
    if (validatedData.operation_type !== undefined) updateData.operation_type = validatedData.operation_type
    if (validatedData.bedrooms !== undefined) updateData.bedrooms = validatedData.bedrooms
    if (validatedData.bathrooms !== undefined) updateData.bathrooms = validatedData.bathrooms
    if (validatedData.area !== undefined) updateData.area = validatedData.area
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    // Arrays - guardar como JSON en base de datos
    if (validatedData.images_urls !== undefined) {
      updateData.images_urls = JSON.stringify(validatedData.images_urls)
    }
    if (validatedData.amenities !== undefined) {
      updateData.amenities = JSON.stringify(validatedData.amenities)
    }
    if (validatedData.features !== undefined) {
      updateData.features = JSON.stringify(validatedData.features)
    }

    console.log(`[${requestId}] Campos a actualizar:`, Object.keys(updateData))

    // Ejecutar actualización
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)  // Doble validación de ownership
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
    let imageKeys = []
    let imageUrls = []
    
    if (updatedProperty.images_urls) {
      try {
        if (Array.isArray(updatedProperty.images_urls)) {
          imageKeys = updatedProperty.images_urls
        } else {
          const parsed = JSON.parse(updatedProperty.images_urls)
          imageKeys = Array.isArray(parsed) ? parsed : []
        }
      } catch (e) {
        console.log(`[${requestId}] Error parseando images_urls`)
      }
    }

    if (imageKeys.length === 0 && updatedProperty.images) {
      try {
        const parsed = JSON.parse(updatedProperty.images)
        imageKeys = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.log(`[${requestId}] Error parseando images legacy`)
      }
    }

    // Convertir keys a URLs públicas
    imageUrls = imageKeys.map((key: string) => {
      if (key.startsWith('http') || key.startsWith('/')) {
        return key
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${key}`
    })

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
      
      // Imágenes: URLs absolutas para preview
      images: imageUrls,
      // Keys para el uploader
      images_urls: imageKeys,
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
