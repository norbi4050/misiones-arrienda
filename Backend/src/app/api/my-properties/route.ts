import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generatePublicCoverUrl } from '@/lib/signed-urls'

// Schema para validar parámetros de consulta
const getMyPropertiesSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(12),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'ALL']).optional().default('ALL'),
  orderBy: z.enum(['created_at', 'updated_at', 'title', 'price']).optional().default('updated_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/my-properties - Obtener propiedades del usuario autenticado
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/my-properties [${requestId}] ===`)

  try {
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

    // Parsear parámetros de consulta
    const { searchParams } = new URL(request.url)
    const params = getMyPropertiesSchema.parse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
      status: searchParams.get('status') || 'ALL',
      orderBy: searchParams.get('orderBy') || 'updated_at',
      order: searchParams.get('order') || 'desc'
    })

    console.log(`[${requestId}] Parámetros:`, params)

    // Construir query base
    let query = supabase
      .from('properties')
      .select(`
        id, title, description, price, currency, city, province, address,
        property_type, bedrooms, bathrooms, garages, area, lot_area,
        images_urls, images, status, is_active,
        amenities, features, year_built, floor, total_floors,
        created_at, updated_at, expires_at, operation_type
      `)
      .eq('user_id', user.id)  // Solo propiedades del usuario

    // Aplicar filtro de estado si no es 'ALL'
    if (params.status !== 'ALL') {
      query = query.eq('status', params.status)
    }

    // Aplicar ordenamiento
    query = query.order(params.orderBy, { ascending: params.order === 'asc' })

    // Calcular offset para paginación
    const offset = (params.page - 1) * params.limit
    query = query.range(offset, offset + params.limit - 1)

    // Ejecutar consulta
    const { data: properties, error: propertiesError } = await query

    if (propertiesError) {
      console.error(`[${requestId}] Error obteniendo propiedades:`, propertiesError)
      return NextResponse.json(
        { error: 'Error al obtener propiedades' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Propiedades encontradas:`, properties?.length || 0)

    // Base URL pública para bucket property-images
    const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/`
    
    // Procesar propiedades para respuesta con URLs públicas
    const processedProperties = await Promise.all(
      (properties || []).map(async (property: any) => {
        // Procesar imágenes: convertir keys a URLs públicas
        let images = []
        
        // 1. Prioridad: images_urls (nuevo) - manejar tanto arrays como JSON
        if (Array.isArray(property.images_urls)) {
          // Array PostgreSQL directo
          images = property.images_urls.map((k: string) => 
            k.startsWith('http') ? k : `${publicBase}${k}`
          )
          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ [MIS-PROPS] images_urls (array): ${property.id} → ${images.length} URLs`)
          }
        } else if (property.images_urls) {
          // String JSON
          try {
            const parsed = JSON.parse(property.images_urls)
            if (Array.isArray(parsed)) {
              images = parsed.map((k: string) => 
                k.startsWith('http') ? k : `${publicBase}${k}`
              )
              if (process.env.NODE_ENV !== 'production') {
                console.log(`✅ [MIS-PROPS] images_urls (JSON): ${property.id} → ${images.length} URLs`)
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`⚠️ [MIS-PROPS] Error parseando images_urls: ${property.id}`)
            }
          }
        }
        
        // 2. Fallback: images (legacy) si images_urls está vacío
        if (images.length === 0 && property.images) {
          try {
            const parsed = JSON.parse(property.images)
            if (Array.isArray(parsed)) {
              images = parsed.map((k: string) => 
                k.startsWith('http') ? k : `${publicBase}${k}`
              )
              if (process.env.NODE_ENV !== 'production') {
                console.log(`✅ [MIS-PROPS] images (legacy): ${property.id} → ${images.length} URLs`)
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`⚠️ [MIS-PROPS] Error parseando images legacy: ${property.id}`)
            }
          }
        }
        
        // 3. coverUrl = primera imagen real o null
        const coverUrl = images.length > 0 ? images[0] : null
        
        // Mantener lógica existente de isPlaceholder y coverUrlExpiresAt
        const coverResult = {
          coverUrl: coverUrl,
          coverUrlExpiresAt: coverUrl ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
          isPlaceholder: coverUrl === null
        }

        return {
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
          // Campo images: string[] mapeado desde images_urls (SSoT)
          images: images,
          coverUrl: coverResult.coverUrl,
          coverUrlExpiresAt: coverResult.coverUrlExpiresAt,
          isPlaceholder: coverResult.isPlaceholder,
          imagesCount: images.length
        }
      })
    )

    // Obtener total para paginación
    let countQuery = supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (params.status !== 'ALL') {
      countQuery = countQuery.eq('status', params.status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`[${requestId}] Error obteniendo total:`, countError)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / params.limit)

    console.log(`[${requestId}] Total propiedades: ${total}, Páginas: ${totalPages}`)

    return NextResponse.json({
      properties: processedProperties,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1
      },
      filters: {
        status: params.status,
        orderBy: params.orderBy,
        order: params.order
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
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
