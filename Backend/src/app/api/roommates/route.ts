import { NextRequest, NextResponse } from 'next/server'
import { keysToPublicUrls } from '@/lib/community-images'
import { transformRoommateFromDB } from '@/types/roommate'
import { roommateFiltersSchema } from '@/lib/validations/roommate'

// =====================================================
// GET /api/roommates - FEED PÚBLICO CON FILTROS
// =====================================================

// Función para mapear roommate de DB a respuesta con URLs públicas
async function mapRoommateToResponse(roommate: any) {
  // Procesar imágenes usando helper
  let imagesKeys: string[] = []
  
  // 1. Prioridad: images_urls (nuevo) - manejar tanto arrays como JSON
  if (Array.isArray(roommate.images_urls)) {
    imagesKeys = roommate.images_urls
  } else if (roommate.images_urls) {
    try {
      const parsed = JSON.parse(roommate.images_urls)
      if (Array.isArray(parsed)) {
        imagesKeys = parsed
      }
    } catch (e) {
      console.warn(`Error parseando roommate images_urls: ${roommate.id}`)
    }
  }
  
  // 2. Fallback: images (legacy) si images_urls está vacío
  if (imagesKeys.length === 0 && roommate.images) {
    try {
      const parsed = JSON.parse(roommate.images)
      if (Array.isArray(parsed)) {
        imagesKeys = parsed
      }
    } catch (e) {
      console.warn(`Error parseando roommate images legacy: ${roommate.id}`)
    }
  }
  
  // Convertir keys a URLs públicas usando helper
  const images = keysToPublicUrls(imagesKeys)
  const coverUrl = images.length > 0 ? images[0] : null

  return {
    id: roommate.id,
    title: roommate.title,
    description: roommate.description,
    city: roommate.city,
    province: roommate.province,
    roomType: roommate.room_type,
    monthlyRent: roommate.monthly_rent,
    availableFrom: roommate.available_from,
    preferences: roommate.preferences,
    images: images, // URLs públicas absolutas
    status: roommate.status,
    isActive: roommate.is_active,
    likesCount: roommate.likes_count || 0,
    viewsCount: roommate.views_count || 0,
    slug: roommate.slug,
    createdAt: roommate.created_at,
    publishedAt: roommate.published_at,
    // Campos de imagen optimizados
    coverUrl: coverUrl,
    isPlaceholder: coverUrl === null,
    imagesCount: images.length,
    // NO exponer user_id por seguridad en feed público
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/roommates [${requestId}] ===`)
  
  try {
    const url = new URL(request.url)
    const params = url.searchParams

    // Parse y validar filtros del querystring
    const rawFilters = {
      q: params.get('q') || undefined,
      city: params.get('city') || undefined,
      province: params.get('province') || undefined,
      roomType: params.get('roomType') || undefined,
      minRent: params.get('minRent') ? Number(params.get('minRent')) : undefined,
      maxRent: params.get('maxRent') ? Number(params.get('maxRent')) : undefined,
      availableFrom: params.get('availableFrom') || undefined,
      order: params.get('order') || 'recent',
      page: Math.max(1, Number(params.get('page') || '1')),
      limit: Math.max(1, Math.min(50, Number(params.get('limit') || '12')))
    }

    // Validar filtros con Zod
    const validationResult = roommateFiltersSchema.safeParse(rawFilters)
    if (!validationResult.success) {
      console.error(`[${requestId}] Filtros inválidos:`, validationResult.error)
      return NextResponse.json({
        error: 'Filtros inválidos',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const filters = validationResult.data
    const { q, city, province, roomType, minRent, maxRent, availableFrom, order, page, limit } = filters

    // Paginación
    const offset = (page - 1) * limit

    console.log(`[${requestId}] Filtros validados:`, {
      q, city, province, roomType, minRent, maxRent, availableFrom, order, page, limit
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
      .from('roommate_posts')
      .select(`
        id, title, description, city, province, room_type,
        monthly_rent, available_from, preferences, images, 
        status, is_active, likes_count, views_count, slug,
        created_at, published_at, images_urls
      `, { count: 'exact' })
      .eq('status', 'PUBLISHED')  // FILTRO RESTRICTIVO OBLIGATORIO
      .eq('is_active', true)      // FILTRO RESTRICTIVO OBLIGATORIO

    // Aplicar filtros opcionales
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    if (province) {
      query = query.ilike('province', `%${province}%`)
    }

    if (roomType) {
      query = query.eq('room_type', roomType)
    }

    if (minRent !== undefined) {
      query = query.gte('monthly_rent', minRent)
    }

    if (maxRent !== undefined) {
      query = query.lte('monthly_rent', maxRent)
    }

    if (availableFrom) {
      query = query.gte('available_from', availableFrom)
    }

    // Búsqueda de texto optimizada con full-text search
    if (q && q.trim().length >= 2) {
      const searchTerm = q.trim()
      
      try {
        // Búsqueda principal: Full-text search en español
        query = query.textSearch('search_tsv', searchTerm, {
          type: 'websearch',
          config: 'spanish'
        })
        console.log(`[${requestId}] Usando full-text search para: "${searchTerm}"`)
      } catch (textSearchError) {
        console.log(`[${requestId}] Full-text search no disponible, usando ILIKE fallback`)
        
        // Fallback: ILIKE en campos principales
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      }
    }

    // Aplicar orden
    if (order === 'trending') {
      // Trending: likes_count * 3 + log(1 + views_count)
      query = query.order('likes_count', { ascending: false })
        .order('views_count', { ascending: false })
        .order('published_at', { ascending: false })
    } else {
      // Recent: published_at desc (default)
      query = query.order('published_at', { ascending: false })
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    console.log(`[${requestId}] Ejecutando query de roommates...`)

    // Ejecutar consulta
    const { data: roommates, error, count } = await query

    if (error) {
      console.error(`[${requestId}] Error de Supabase:`, {
        message: error.message,
        code: error.code,
        details: error.details
      })

      // En caso de error, devolver respuesta vacía
      return NextResponse.json({
        items: [],
        count: 0,
        meta: {
          dataSource: 'db',
          error: true,
          message: 'Error al consultar roommates',
          requestId,
          filters,
          sorting: { orderBy: order, order: 'desc' },
          pagination: { page, pageSize: limit, offset }
        }
      })
    }

    console.log(`[${requestId}] Roommates encontrados:`, roommates?.length || 0)
    console.log(`[${requestId}] Total count:`, count)

    // Log cuando no hay resultados
    if ((roommates?.length || 0) === 0) {
      console.log(`[${requestId}] Sin resultados - Filtros efectivos:`, {
        status: 'PUBLISHED',
        is_active: true,
        applied_filters: { city, province, roomType, minRent, maxRent, availableFrom, q }
      })
    }

    // Mapear roommates a formato de respuesta con URLs públicas
    const mappedRoommates = await Promise.all(
      (roommates || []).map(roommate => mapRoommateToResponse(roommate))
    )

    return NextResponse.json({
      items: mappedRoommates,
      count: count || 0,
      meta: {
        dataSource: 'db',
        requestId,
        filters,
        sorting: { orderBy: order, order: 'desc' },
        pagination: { 
          page, 
          pageSize: limit, 
          offset, 
          totalPages: Math.ceil((count || 0) / limit) 
        }
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

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

// =====================================================
// POST /api/roommates - CREAR ROOMMATE POST
// =====================================================

export async function POST(request: NextRequest) {
  console.log('=== POST /api/roommates - CREAR ROOMMATE POST ===')
  
  try {
    // Verificar tamaño del body
    const bodyText = await request.text()
    const bodySizeKB = Buffer.byteLength(bodyText, 'utf8') / 1024
    
    console.log(`📊 Body size: ${bodySizeKB.toFixed(2)}KB`)
    
    if (bodySizeKB > 50) {
      console.warn(`⚠️ Body size (${bodySizeKB.toFixed(2)}KB) exceeds recommended 50KB for roommate creation`)
    }

    const body = JSON.parse(bodyText)
    
    // Importar autenticación
    const { getAuthenticatedUser } = await import('@/lib/auth-middleware')
    
    // Verificar autenticación del usuario
    const authenticatedUser = await getAuthenticatedUser(request)
    if (!authenticatedUser) {
      console.log('❌ Usuario no autenticado')
      return NextResponse.json(
        { error: 'Usuario no autenticado. Debe iniciar sesión para crear posts de roommate.' },
        { status: 401 }
      )
    }

    console.log('✅ Usuario autenticado:', authenticatedUser.id)

    // Validar campos mínimos requeridos para DRAFT
    const requiredFields = ['title', 'description', 'city', 'roomType', 'monthlyRent', 'availableFrom']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.log('❌ Campos mínimos faltantes:', missingFields)
      return NextResponse.json(
        { error: `Campos mínimos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar y normalizar datos
    const { createRoommateSchema } = await import('@/lib/validations/roommate')
    const validationResult = createRoommateSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('❌ Validación fallida:', validationResult.error)
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    console.log('✅ Datos validados para roommate DRAFT')

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

    // Generar slug único
    const { generateRoommateSlug } = await import('@/lib/validations/roommate')
    const tempId = Math.random().toString(36).substring(2, 15)
    const slug = generateRoommateSlug(validatedData.title, tempId)

    // Preparar datos para inserción (snake_case para DB)
    const roommateData = {
      title: validatedData.title,
      description: validatedData.description,
      city: validatedData.city,
      province: validatedData.province || 'Misiones',
      room_type: validatedData.roomType,
      monthly_rent: validatedData.monthlyRent,
      available_from: validatedData.availableFrom,
      preferences: validatedData.preferences || null,
      
      // Usuario y estado DRAFT
      user_id: authenticatedUser.id,
      status: 'DRAFT',
      is_active: true,
      
      // Imágenes como arrays JSON
      images: JSON.stringify(validatedData.images || []),
      images_urls: JSON.stringify(validatedData.imagesUrls || []),
      
      // Campos por defecto
      likes_count: 0,
      views_count: 0,
      slug: slug,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('🔧 Insertando roommate DRAFT...')

    // Insertar roommate post
    const { data: roommate, error: roommateError } = await supabaseAdmin
      .from('roommate_posts')
      .insert(roommateData)
      .select('id, title, city, room_type, monthly_rent, status, slug')
      .single()

    if (roommateError) {
      console.error('❌ Error insertando roommate DRAFT:', {
        message: roommateError.message,
        code: roommateError.code,
        details: roommateError.details,
        hint: roommateError.hint
      })
      
      // Respuestas específicas según el tipo de error
      if (roommateError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un post de roommate con estos datos' },
          { status: 409 }
        )
      }
      
      if (roommateError.code === '23503') {
        return NextResponse.json(
          { error: 'Error de referencia en los datos' },
          { status: 400 }
        )
      }
      
      if (roommateError.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Permisos insuficientes para crear el post' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: `Error al crear borrador de roommate: ${roommateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Roommate DRAFT creado exitosamente:', roommate.id)

    return NextResponse.json({
      id: roommate.id,
      title: roommate.title,
      city: roommate.city,
      roomType: roommate.room_type,
      monthlyRent: roommate.monthly_rent,
      status: roommate.status,
      slug: roommate.slug,
      message: 'Borrador de roommate creado exitosamente. Continúe con la carga de imágenes y detalles.'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in POST /api/roommates:', {
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
      { error: 'Error interno del servidor al crear el post de roommate' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
