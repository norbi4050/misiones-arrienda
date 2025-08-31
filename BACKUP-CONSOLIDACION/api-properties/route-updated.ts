import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validatePropertyWithAuth, propertyFiltersSchema } from '@/lib/validations/property'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validar parámetros de filtrado con el nuevo schema
    const filters = propertyFiltersSchema.parse({
      city: searchParams.get('city') || undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minBedrooms: searchParams.get('minBedrooms') ? Number(searchParams.get('minBedrooms')) : undefined,
      minBathrooms: searchParams.get('minBathrooms') ? Number(searchParams.get('minBathrooms')) : undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      status: searchParams.get('status') as any || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10
    })

    const offset = (filters.page - 1) * filters.limit

    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('status', filters.status || 'AVAILABLE')
      .order('featured', { ascending: false })
      .order('createdAt', { ascending: false })

    // Aplicar filtros dinámicamente
    if (filters.city) {
      query = query.eq('city', filters.city)
    }
    
    if (filters.propertyType) {
      query = query.eq('propertyType', filters.propertyType)
    }
    
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice)
    }
    
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }
    
    if (filters.minBedrooms) {
      query = query.gte('bedrooms', filters.minBedrooms)
    }
    
    if (filters.minBathrooms) {
      query = query.gte('bathrooms', filters.minBathrooms)
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    // Paginación
    query = query.range(offset, offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching properties:', error)
      return NextResponse.json(
        { error: 'Error al obtener propiedades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      properties: data || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit)
      },
      filters: filters
    })

  } catch (error) {
    console.error('Error in GET /api/properties:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extraer userId del header de autorización o del body
    const authHeader = request.headers.get('authorization')
    const userId = authHeader?.replace('Bearer ', '') || body.userId || body.user_id
    
    // Validar datos con autenticación usando las nuevas validaciones
    const validation = validatePropertyWithAuth(body, userId)
    
    if (!validation.success) {
      const errorDetails = validation.error ? 
        ('errors' in validation.error ? validation.error.errors : validation.error.message) : 
        'Error de validación'
      
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: errorDetails
        },
        { status: 400 }
      )
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'No se pudieron procesar los datos' },
        { status: 400 }
      )
    }

    const data = validation.data

    // Preparar datos para inserción con validación JSON
    const { mascotas, expensasIncl, servicios, ...baseData } = data
    
    const propertyData = {
      ...baseData,
      // Convertir arrays a JSON strings para Supabase (ya validados)
      images: JSON.stringify(data.images),
      amenities: JSON.stringify(data.amenities),
      features: JSON.stringify(data.features),
      // Campos de sistema
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Campos adicionales del formulario (no en Prisma directamente)
      metadata: JSON.stringify({
        mascotas,
        expensasIncl,
        servicios
      })
    }

    const { data: insertedProperty, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single()

    if (error) {
      console.error('Error creating property:', error)
      return NextResponse.json(
        { error: 'Error al crear la propiedad', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Propiedad creada exitosamente',
        property: insertedProperty
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error in POST /api/properties:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
