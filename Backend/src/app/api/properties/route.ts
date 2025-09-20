import { NextRequest, NextResponse } from 'next/server'
import { generateCoverUrl } from '@/lib/signed-urls'

// Función para mapear snake_case a camelCase con signed URLs
async function mapPropertyToResponse(property: any) {
  // Procesar imágenes con fallback entre campos legacy y nuevos
  let imageUrls = []
  let coverImageKey = null
  
  // Intentar primero images_urls (nuevo)
  if (property.images_urls) {
    try {
      const parsed = JSON.parse(property.images_urls)
      imageUrls = Array.isArray(parsed) ? parsed : []
      console.log(`Imágenes encontradas en images_urls para propiedad ${property.id}:`, imageUrls.length)
    } catch (e) {
      console.log(`Error parseando images_urls para propiedad ${property.id}:`, e)
    }
  }
  
  // Fallback a images (legacy) si images_urls está vacío
  if (imageUrls.length === 0 && property.images) {
    try {
      const parsed = JSON.parse(property.images)
      imageUrls = Array.isArray(parsed) ? parsed : []
      console.log(`Imágenes encontradas en images (legacy) para propiedad ${property.id}:`, imageUrls.length)
    } catch (e) {
      console.log(`Error parseando images legacy para propiedad ${property.id}:`, e)
    }
  }
  
  // Si aún no hay imágenes, usar placeholder
  if (imageUrls.length === 0) {
    console.log(`No se encontraron imágenes para propiedad ${property.id}, usando placeholder`)
    imageUrls = ['/placeholder-house-1.jpg']
  }
  
  // Usar primer imagen como cover
  coverImageKey = imageUrls.length > 0 ? imageUrls[0] : null
  
  // Generar signed URL para cover image
  const coverResult = await generateCoverUrl(
    coverImageKey, 
    property.property_type
  )

  return {
    id: property.id,
    title: property.title,
    price: property.price,
    currency: property.currency || 'ARS',
    city: property.city,
    province: property.province,
    propertyType: property.property_type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    images: imageUrls, // URLs procesadas y validadas
    status: property.status,
    isActive: property.is_active,
    createdAt: property.created_at,
    operationType: property.operation_type,
    // Campos optimizados con signed URLs
    coverUrl: coverResult.coverUrl,
    coverUrlExpiresAt: coverResult.coverUrlExpiresAt,
    isPlaceholder: coverResult.isPlaceholder,
    imagesCount: imageUrls.length,
    // NO exponer user_id por seguridad
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/properties [${requestId}] ===`)
  
  try {
    const url = new URL(request.url)
    const params = url.searchParams

    // Parse filtros del querystring
    const city = params.get('city') || ''
    const province = params.get('province') || ''
    const propertyType = params.get('propertyType') || ''
    const operationType = params.get('operationType') || ''
    const priceMin = params.get('priceMin') ? Number(params.get('priceMin')) : null
    const priceMax = params.get('priceMax') ? Number(params.get('priceMax')) : null
    const bedroomsMin = params.get('bedroomsMin') ? Number(params.get('bedroomsMin')) : null
    const bathroomsMin = params.get('bathroomsMin') ? Number(params.get('bathroomsMin')) : null
    const areaMin = params.get('minArea') ? Number(params.get('minArea')) : null
    const q = params.get('q') || '' // Búsqueda de texto

    // Paginación
    const page = Math.max(1, Number(params.get('page') || '1'))
    const pageSize = Math.max(1, Math.min(50, Number(params.get('limit') || '12')))
    const offset = (page - 1) * pageSize

    // Orden
    const orderBy = params.get('orderBy') || 'created_at'
    const order = params.get('order') || 'desc'

    console.log(`[${requestId}] Filtros:`, {
      city, province, propertyType, operationType, priceMin, priceMax,
      bedroomsMin, bathroomsMin, areaMin, q, page, pageSize, orderBy, order
    })

    // Crear cliente Supabase con Service Role (con filtros restrictivos)
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

    // Construir query con filtros restrictivos obligatorios
    let query = supabase
      .from('properties')
      .select(`
        id, title, price, currency, city, province, property_type,
        bedrooms, bathrooms, area, images, status, is_active,
        created_at, operation_type, images_urls
      `, { count: 'exact' })
      .in('status', ['PUBLISHED', 'AVAILABLE'])  // FILTRO RESTRICTIVO OBLIGATORIO
      .eq('is_active', true)                     // FILTRO RESTRICTIVO OBLIGATORIO

    // Aplicar filtros opcionales
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    if (province) {
      query = query.ilike('province', `%${province}%`)
    }

    if (propertyType) {
      query = query.eq('property_type', propertyType)
    }

    if (operationType) {
      query = query.eq('operation_type', operationType)
    }

    if (priceMin !== null) {
      query = query.gte('price', priceMin)
    }

    if (priceMax !== null) {
      query = query.lte('price', priceMax)
    }

    if (bedroomsMin !== null) {
      query = query.gte('bedrooms', bedroomsMin)
    }

    if (bathroomsMin !== null) {
      query = query.gte('bathrooms', bathroomsMin)
    }

    if (areaMin !== null) {
      query = query.gte('area', areaMin)
    }

    // Búsqueda de texto optimizada con fallback
    let effectivePageSize = pageSize
    if (q) {
      const searchTerm = q.trim()
      
      if (searchTerm.length >= 3) {
        // Búsqueda principal: Full-text search (más eficiente)
        // Nota: Requiere índice GIN creado en la migración
        try {
          query = query.textSearch('title_description_search', searchTerm, {
            type: 'websearch',
            config: 'spanish'
          })
        } catch (textSearchError) {
          console.log(`[${requestId}] Full-text search no disponible, usando ILIKE fallback`)
          
          // Fallback: ILIKE con límite razonable para evitar queries lentas
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          
          // Reducir pageSize para búsquedas ILIKE (evitar timeout)
          if (pageSize > 20) {
            console.log(`[${requestId}] Reduciendo pageSize de ${pageSize} a 20 para búsqueda ILIKE`)
            effectivePageSize = 20
          }
        }
      } else {
        // Para términos muy cortos, usar ILIKE con límite estricto
        console.log(`[${requestId}] Término de búsqueda corto (${searchTerm.length} chars), aplicando límite estricto`)
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        
        // Límite muy restrictivo para términos cortos (evitar resultados masivos)
        effectivePageSize = Math.min(10, pageSize)
      }
    }

    // Aplicar orden
    const orderColumn = orderBy === 'createdAt' ? 'created_at' : 
                       orderBy === 'propertyType' ? 'property_type' : orderBy
    query = query.order(orderColumn, { ascending: order === 'asc' })

    // Aplicar paginación (una sola vez con effectivePageSize)
    query = query.range(offset, offset + effectivePageSize - 1)

    console.log(`[${requestId}] Ejecutando query...`)

    // Ejecutar consulta
    const { data: properties, error, count } = await query

    if (error) {
      console.error(`[${requestId}] Error de Supabase:`, {
        message: error.message,
        code: error.code,
        details: error.details
      })

      // En caso de error, devolver respuesta vacía (NO volver a mock)
      return NextResponse.json({
        items: [],
        count: 0,
        meta: {
          dataSource: 'db',
          error: true,
          message: 'Error al consultar propiedades',
          requestId,
          filters: { city, province, propertyType, operationType, priceMin, priceMax, bedroomsMin, bathroomsMin, areaMin, q },
          sorting: { orderBy: orderColumn, order },
          pagination: { page, pageSize, offset }
        }
      })
    }

    console.log(`[${requestId}] Propiedades encontradas:`, properties?.length || 0)
    console.log(`[${requestId}] Total count:`, count)

    // Log no ruidoso cuando no hay resultados
    if ((properties?.length || 0) === 0) {
      console.log(`[${requestId}] Sin resultados - Filtros efectivos:`, {
        status: 'IN (PUBLISHED,AVAILABLE)',
        is_active: true,
        applied_filters: { city, province, propertyType, operationType, priceMin, priceMax, bedroomsMin, bathroomsMin, areaMin, q }
      })
    }

    // Mapear propiedades a formato de respuesta (snake_case → camelCase) con signed URLs
    const mappedProperties = await Promise.all(
      (properties || []).map(property => mapPropertyToResponse(property))
    )

    return NextResponse.json({
      items: mappedProperties,
      count: count || 0,
      meta: {
        dataSource: 'db',
        requestId,
        filters: { city, province, propertyType, operationType, priceMin, priceMax, bedroomsMin, bathroomsMin, areaMin, q },
        sorting: { orderBy: orderColumn, order },
        pagination: { page, pageSize, offset, totalPages: Math.ceil((count || 0) / pageSize) }
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // En caso de error, devolver respuesta vacía (NO volver a mock)
    return NextResponse.json({
      items: [],
      count: 0,
      meta: {
        dataSource: 'db',
        error: true,
        message: 'Error interno del servidor',
        requestId
      }
    })
  }
}

// Runtime configuration for server operations
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('=== POST /api/properties - CREAR DRAFT CON PAYLOAD MÍNIMO ===')
  
  try {
    // Verificar tamaño del body
    const bodyText = await request.text()
    const bodySizeKB = Buffer.byteLength(bodyText, 'utf8') / 1024
    
    console.log(`📊 Body size: ${bodySizeKB.toFixed(2)}KB`)
    
    if (bodySizeKB > 50) {
      console.warn(`⚠️ Body size (${bodySizeKB.toFixed(2)}KB) exceeds recommended 50KB for DRAFT creation`)
    }

    const body = JSON.parse(bodyText)
    
    // Importar autenticación
    const { getAuthenticatedUser } = await import('@/lib/auth-middleware')
    
    // Verificar autenticación del usuario
    const authenticatedUser = await getAuthenticatedUser(request)
    if (!authenticatedUser) {
      console.log('❌ Usuario no autenticado')
      return NextResponse.json(
        { error: 'Usuario no autenticado. Debe iniciar sesión para crear propiedades.' },
        { status: 401 }
      )
    }

    console.log('✅ Usuario autenticado:', authenticatedUser.id)

    // Validar campos mínimos requeridos para DRAFT
    const requiredFields = ['title', 'city', 'province', 'price']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.log('❌ Campos mínimos faltantes:', missingFields)
      return NextResponse.json(
        { error: `Campos mínimos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Normalizar y validar precio
    const numericPrice = Number(body.price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.log('❌ Precio inválido:', body.price)
      return NextResponse.json(
        { error: 'El precio debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    // Normalizar campos numéricos opcionales
    const normalizedData: any = {
      // Campos mínimos requeridos
      title: String(body.title).trim(),
      city: String(body.city).trim(),
      province: String(body.province).trim(),
      price: numericPrice
    }

    // Campos opcionales (solo incluir si tienen valor válido)
    if (body.property_type && String(body.property_type).trim()) {
      normalizedData.property_type = String(body.property_type).trim()
    }

    if (body.bedrooms && !isNaN(Number(body.bedrooms))) {
      normalizedData.bedrooms = Number(body.bedrooms)
    }

    if (body.bathrooms && !isNaN(Number(body.bathrooms))) {
      normalizedData.bathrooms = Number(body.bathrooms)
    }

    if (body.area && !isNaN(Number(body.area))) {
      normalizedData.area = Number(body.area)
    }

    console.log('✅ Datos normalizados para DRAFT:', normalizedData)
    console.log('📊 Campos enviados:', Object.keys(normalizedData).length)

    // Crear cliente admin con Service Role Key
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Preparar datos mínimos para DRAFT (snake_case exacto)
    const draftData = {
      // Campos mínimos requeridos
      title: normalizedData.title,
      city: normalizedData.city,
      province: normalizedData.province,
      price: normalizedData.price,
      
      // Campos opcionales normalizados
      ...normalizedData.property_type && { property_type: normalizedData.property_type },
      ...normalizedData.bedrooms && { bedrooms: normalizedData.bedrooms },
      ...normalizedData.bathrooms && { bathrooms: normalizedData.bathrooms },
      ...normalizedData.area && { area: normalizedData.area },
      
      // Usuario y estado DRAFT
      user_id: authenticatedUser.id,
      status: 'DRAFT',
      is_active: false,
      is_paid: false,
      featured: false,
      
      // Campos por defecto mínimos
      currency: 'ARS',
      description: 'Borrador - Completar información',
      address: 'Por completar',
      postal_code: '0000',
      operation_type: 'rent',
      
      // Arrays vacíos como JSON
      images: JSON.stringify([]),
      amenities: JSON.stringify([]),
      features: JSON.stringify([])
    }

    console.log('🔧 Insertando DRAFT con datos mínimos...')

    // Insertar propiedad DRAFT
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .insert(draftData)
      .select('id, title, price, city, status')
      .single()

    if (propertyError) {
      console.error('❌ Error insertando DRAFT:', {
        message: propertyError.message,
        code: propertyError.code,
        details: propertyError.details,
        hint: propertyError.hint
      })
      
      // Respuestas específicas según el tipo de error
      if (propertyError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe una propiedad con estos datos' },
          { status: 409 }
        )
      }
      
      if (propertyError.code === '23503') {
        return NextResponse.json(
          { error: 'Error de referencia en los datos' },
          { status: 400 }
        )
      }
      
      if (propertyError.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Permisos insuficientes para crear la propiedad' },
          { status: 403 }
        )
      }

      // Error de validación específico
      if (propertyError.code === '23514') {
        return NextResponse.json(
          { error: 'Datos inválidos: verifique que el precio sea positivo' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: `Error al crear borrador: ${propertyError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ DRAFT creado exitosamente:', property.id)

    return NextResponse.json({
      id: property.id,
      title: property.title,
      price: property.price,
      city: property.city,
      status: property.status,
      message: 'Borrador creado exitosamente. Continúe con la carga de imágenes y detalles.'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in POST /api/properties:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    // Si el error es de parsing JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de datos inválido - JSON malformado' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al crear el borrador' },
      { status: 500 }
    )
  }
}
