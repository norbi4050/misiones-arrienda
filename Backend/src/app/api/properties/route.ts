import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { propertySchema } from '@/lib/validations/property';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    // Parámetros de búsqueda
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Construir query
    let query = supabase
      .from('Property')
      .select('*')
      .eq('status', 'AVAILABLE');

    // Aplicar filtros
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    
    if (type) {
      query = query.eq('propertyType', type);
    }
    
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }
    
    if (bedrooms) {
      query = query.eq('bedrooms', parseInt(bedrooms));
    }
    
    if (bathrooms) {
      query = query.eq('bathrooms', parseInt(bathrooms));
    }

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    query = query.range(startIndex, startIndex + limit - 1);

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json(
        { error: 'Error fetching properties', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      properties: properties || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in properties API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    // Validar datos con schema
    const validationResult = propertySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const propertyData = validationResult.data;
    
    // Obtener usuario actual (si está autenticado)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Preparar datos para inserción
    const insertData = {
      ...propertyData,
      userId: user?.id || null,
      propertyType: propertyData.type, // Mapear type a propertyType
      images: JSON.stringify(propertyData.images || []),
      amenities: JSON.stringify(propertyData.amenities || []),
      features: JSON.stringify(propertyData.features || []),
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
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: 'Error creating property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Property created successfully',
        property: newProperty
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST properties API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
