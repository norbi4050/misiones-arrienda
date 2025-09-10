import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Debug flag para logging
    const debug = searchParams.get('debug') === '1';
    const dataSource = 'supabase';

    // Parse pagination params
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') ?? 12)));
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

    // Parse filter params (solo para debug, no aplicar si debug=1)
    const filters = {
      city: searchParams.get('city') ?? '',
      province: searchParams.get('province') ?? '',
      propertyType: searchParams.get('propertyType') ?? '',
      priceMin: searchParams.get('priceMin') ?? '',
      priceMax: searchParams.get('priceMax') ?? '',
      bedroomsMin: searchParams.get('bedroomsMin') ?? '',
      bathroomsMin: searchParams.get('bathroomsMin') ?? '',
      minArea: searchParams.get('minArea') ?? '',
      maxArea: searchParams.get('maxArea') ?? '',
      amenities: searchParams.get('amenities') ?? ''
    };

    // Parse sorting params
    const orderBy = searchParams.get('orderBy') ?? 'createdAt';
    const order = (searchParams.get('order') ?? 'desc').toLowerCase();

    // Usar el mismo cliente Supabase que en /api/properties/[id]
    const supabase = createServerSupabase();

    // Query mínimo a Supabase
    let query = supabase
      .from('Property')
      .select('id,title,city,province,price,propertyType,userId,images,coverImagePath,createdAt,updatedAt,bedrooms,bathrooms,area')
      .eq('status', 'PUBLISHED')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    // Agregar is_active si existe (try/catch para no romper si no existe)
    try {
      query = query.eq('is_active', true);
    } catch (error) {
      // Si la columna no existe, continuar sin ella
      if (debug) {
        console.log('[LIST API] is_active column not found, continuing without it');
      }
    }

    // NO aplicar otros filtros si debug=1 (ignorar ciudad/provincia/etc)
    if (!debug) {
      // Aplicar filtros básicos si no es debug mode
      if (filters.city && filters.city.length >= 2) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.province && filters.province.length >= 2) {
        query = query.ilike('province', `%${filters.province}%`);
      }
      if (filters.propertyType) {
        query = query.eq('propertyType', filters.propertyType);
      }
      // Agregar más filtros según sea necesario...
    }

    const { data, error } = await query;

    // Logging solo en dev o debug=1
    if (debug || process.env.NODE_ENV === 'development') {
      console.log('[LIST API]', { dataSource, rows: data?.length, error });
    }

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        {
          error: 'Database query failed',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: data ?? [],
      count: data?.length ?? 0,
      meta: {
        dataSource,
        filters,
        sorting: { orderBy, order },
        pagination: { limit, offset },
      }
    });

  } catch (error) {
    console.error('Error in properties API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validación básica de campos requeridos
    const requiredFields = ['title', 'price', 'propertyType', 'city', 'province'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: `Missing required fields: ${missingFields.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Usar el mismo cliente Supabase que en GET
    const supabase = createServerSupabase();

    // Obtener usuario actual (si está autenticado)
    const { data: { user } } = await supabase.auth.getUser();

    // Preparar datos para inserción
    const insertData = {
      ...body,
      userId: user?.id || null,
      images: JSON.stringify(body.images || []),
      amenities: JSON.stringify(body.amenities || []),
      features: JSON.stringify(body.features || []),
      contact_name: body.contact_name || 'Sin nombre',
      contact_phone: body.contact_phone || '',
      contact_email: body.contact_email || '',
      country: body.country || 'Argentina',
      status: 'PUBLISHED', // Forzar status PUBLISHED según requerimientos
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insertar en Supabase
    const { data: newProperty, error } = await supabase
      .from('Property')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        {
          error: 'Database insert failed',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Property created successfully',
        property: newProperty,
        meta: {
          dataSource: 'supabase',
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST properties API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Función auxiliar para validar parámetros de consulta
function validateQueryParams(searchParams: URLSearchParams) {
  const errors = [];
  
  const page = searchParams.get('page');
  if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
    errors.push('Page must be a positive integer');
  }
  
  const limit = searchParams.get('limit');
  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    errors.push('Limit must be between 1 and 100');
  }
  
  const minPrice = searchParams.get('minPrice');
  if (minPrice && (isNaN(parseInt(minPrice)) || parseInt(minPrice) < 0)) {
    errors.push('MinPrice must be a non-negative number');
  }
  
  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice && (isNaN(parseInt(maxPrice)) || parseInt(maxPrice) < 0)) {
    errors.push('MaxPrice must be a non-negative number');
  }
  
  return errors;
}
