// DEPRECATED: ver docs/DECISION-DUPLICADOS.md
// Este archivo es una versión legacy mantenida por compatibilidad
// Usar en su lugar: src/app/api/properties/route.ts

import { NextRequest, NextResponse } from 'next/server'

// Build-safe version - only initialize Supabase at runtime
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  // Dynamic import to avoid build-time issues
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured', properties: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // Construir la consulta base
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (type) {
      query = query.eq('type', type);
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

    // Ejecutar la consulta con paginación
    const { data: properties, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json(
        { error: 'Error fetching properties', details: error.message },
        { status: 500 }
      );
    }

    // Para simplificar, usar el length de los resultados como total aproximado
    const total = properties ? properties.length : 0;

    return NextResponse.json({
      properties: properties || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    const {
      title,
      description,
      price,
      currency = 'ARS',
      type,
      bedrooms,
      bathrooms,
      area,
      address,
      city,
      state,
      province,
      country,
      latitude,
      longitude,
      images,
      amenities,
      contact_name,
      contact_phone,
      contact_email,
      user_id,
      deposit
    } = body;

    // Validación básica
    if (!title || !price || !type || !city || !contact_phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const propertyData = {
      title,
      description,
      price: parseFloat(price),
      currency,
      type,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area: area ? parseFloat(area) : null,
      address,
      city,
      province: province || state, // Usar province si está disponible, sino state
      country: country || 'Argentina',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      images: images || [],
      amenities: amenities || [],
      contact_name,
      contact_phone,
      contact_email,
      user_id,
      deposit: deposit ? parseFloat(deposit) : null,
      status: 'AVAILABLE', // Usar enum value correcto
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: property, error } = await supabase
      .from('properties')
      .insert([propertyData])
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
        property 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST properties API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
