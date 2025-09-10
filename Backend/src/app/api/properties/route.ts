import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { propertySchema } from '@/lib/validations/property';

// Mock data para desarrollo y testing (se puede remover en producción)
const mockProperties = [
  {
    id: '1',
    title: 'Casa en Posadas Centro',
    description: 'Hermosa casa de 3 dormitorios en el centro de Posadas',
    price: 150000,
    currency: 'ARS',
    propertyType: 'HOUSE',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    address: 'Av. Mitre 1234',
    city: 'Posadas',
    province: 'Misiones',
    country: 'Argentina',
    images: ['/placeholder-house-1.jpg'],
    amenities: ['garage', 'garden'],
    contact_name: 'Juan Pérez',
    contact_phone: '+54 376 123456',
    contact_email: 'juan@example.com',
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Departamento en Puerto Iguazú',
    description: 'Moderno departamento de 2 dormitorios cerca de las Cataratas',
    price: 120000,
    currency: 'ARS',
    propertyType: 'APARTMENT',
    bedrooms: 2,
    bathrooms: 1,
    area: 80,
    address: 'Av. Victoria Aguirre 567',
    city: 'Puerto Iguazú',
    province: 'Misiones',
    country: 'Argentina',
    images: ['/placeholder-apartment-1.jpg'],
    amenities: ['pool', 'gym'],
    contact_name: 'María González',
    contact_phone: '+54 3757 987654',
    contact_email: 'maria@example.com',
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Local Comercial en Oberá',
    description: 'Amplio local comercial en zona céntrica de Oberá',
    price: 80000,
    currency: 'ARS',
    propertyType: 'COMMERCIAL',
    bedrooms: 0,
    bathrooms: 1,
    area: 150,
    address: 'Av. Libertad 890',
    city: 'Oberá',
    province: 'Misiones',
    country: 'Argentina',
    images: ['/placeholder-house-2.jpg'],
    amenities: ['parking'],
    contact_name: 'Carlos Rodríguez',
    contact_phone: '+54 3755 456789',
    contact_email: 'carlos@example.com',
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse params según especificaciones exactas
    const city = searchParams.get('city') ?? '';
    const province = searchParams.get('province') ?? '';
    const propertyType = searchParams.get('propertyType') ?? '';
    const priceMin = Number(searchParams.get('priceMin') ?? '');
    const priceMax = Number(searchParams.get('priceMax') ?? '');
    const bedroomsMin = Number(searchParams.get('bedroomsMin') ?? '');
    const bathroomsMin = Number(searchParams.get('bathroomsMin') ?? '');
    const minArea = Number(searchParams.get('minArea') ?? '');
    const maxArea = Number(searchParams.get('maxArea') ?? '');
    const amenities = searchParams.get('amenities') ?? '';
    const orderByRaw = searchParams.get('orderBy') ?? 'createdAt';
    const orderRaw = (searchParams.get('order') ?? 'desc').toLowerCase();
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') ?? 12)));
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

    // Validación priceMin <= priceMax
    const n = (v:any) => (v === null || v === undefined || v === '') ? undefined : Number(v);
    const priceMinN = n(searchParams.get('priceMin'));
    const priceMaxN = n(searchParams.get('priceMax'));

    if (
      priceMinN !== undefined &&
      priceMaxN !== undefined &&
      Number.isFinite(priceMinN) &&
      Number.isFinite(priceMaxN) &&
      priceMinN > priceMaxN
    ) {
      return NextResponse.json({ error: 'priceMin must be <= priceMax' }, { status: 400 });
    }

    // Whitelist orden expandida + orderMap para columnas DB
    const allowedOrderBy = ['createdAt', 'price', 'id', 'bedrooms', 'bathrooms', 'area'] as const;
    const orderMap: Record<(typeof allowedOrderBy)[number], string> = {
      createdAt: 'created_at',
      price: 'price',
      id: 'id',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      area: 'area',
    };
    const safeOrderBy = (allowedOrderBy as readonly string[]).includes(orderByRaw!)
      ? orderMap[orderByRaw as (typeof allowedOrderBy)[number]]
      : 'created_at';
    const safeAscending = orderRaw === 'asc';

    // Intentar conectar con Supabase primero
    const supabase = createServerSupabase();
    let useSupabase = true;
    let items = [];
    let count = 0;

    try {
      // Construir query de Supabase
      let query = supabase
        .from('Property')
        .select('*', { count: 'exact' })
        .eq('status', 'PUBLISHED'); // Siempre forzar status='PUBLISHED'

      // Aplicar filtros con validaciones seguras
      const norm = (s?: string) => (s ?? '').trim();
      if (norm(city).length >= 2) {
        query = query.ilike('city', `%${norm(city)}%`);
      }

      if (norm(province).length >= 2) {
        query = query.ilike('province', `%${norm(province)}%`);
      }

      if (propertyType) {
        query = query.eq('propertyType', propertyType);
      }

      if (!Number.isNaN(priceMin)) {
        query = query.gte('price', priceMin);
      }

      if (!Number.isNaN(priceMax)) {
        query = query.lte('price', priceMax);
      }

      if (!Number.isNaN(bedroomsMin)) {
        query = query.gte('bedrooms', bedroomsMin);
      }

      if (!Number.isNaN(bathroomsMin)) {
        query = query.gte('bathrooms', bathroomsMin);
      }

      if (!Number.isNaN(minArea)) {
        query = query.gte('area', minArea);
      }

      if (!Number.isNaN(maxArea)) {
        query = query.lte('area', maxArea);
      }

      if (amenities) {
        const amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a.length > 0);
        if (amenitiesArray.length > 0) {
          // Filter properties that contain at least one of the specified amenities
          query = query.or(amenitiesArray.map(amenity => `amenities.ilike.%${amenity}%`).join(','));
        }
      }

      // Aplicar ordenamiento
      query = query.order(safeOrderBy, { ascending: safeAscending });

      // Aplicar paginación con offset/limit
      query = query.range(offset, offset + limit - 1);

      const { data: supabaseProperties, error, count: totalCount } = await query;

      if (error) {
        console.warn('Supabase error, falling back to mock data:', error);
        useSupabase = false;
      } else {
        // Filtrar activo en memoria (isActive vs is_active)
        items = (supabaseProperties || []).filter((row: any) => {
          const active = row.isActive ?? row.is_active ?? true;
          return active === true;
        });
        count = totalCount || 0;
      }

    } catch (supabaseError) {
      console.warn('Supabase connection failed, using mock data:', supabaseError);
      useSupabase = false;
    }

    // Fallback a datos mock si Supabase falla
    if (!useSupabase) {
      let filteredProperties = [...mockProperties];

      // Aplicar filtros a datos mock
      if (city) {
        filteredProperties = filteredProperties.filter(p =>
          p.city.toLowerCase().includes(city.toLowerCase())
        );
      }

      if (province) {
        filteredProperties = filteredProperties.filter(p =>
          p.province.toLowerCase().includes(province.toLowerCase())
        );
      }

      if (propertyType) {
        filteredProperties = filteredProperties.filter(p => p.propertyType === propertyType);
      }

      if (!Number.isNaN(priceMin)) {
        filteredProperties = filteredProperties.filter(p => p.price >= priceMin);
      }

      if (!Number.isNaN(priceMax)) {
        filteredProperties = filteredProperties.filter(p => p.price <= priceMax);
      }

      if (!Number.isNaN(bedroomsMin)) {
        filteredProperties = filteredProperties.filter(p => p.bedrooms >= bedroomsMin);
      }

      if (!Number.isNaN(bathroomsMin)) {
        filteredProperties = filteredProperties.filter(p => p.bathrooms >= bathroomsMin);
      }

      if (!Number.isNaN(minArea)) {
        filteredProperties = filteredProperties.filter(p => p.area >= minArea);
      }

      if (!Number.isNaN(maxArea)) {
        filteredProperties = filteredProperties.filter(p => p.area <= maxArea);
      }

      if (amenities) {
        const amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a.length > 0);
        if (amenitiesArray.length > 0) {
          filteredProperties = filteredProperties.filter(p =>
            amenitiesArray.some(amenity =>
              p.amenities.some((propAmenity: string) =>
                propAmenity.toLowerCase().includes(amenity.toLowerCase())
              )
            )
          );
        }
      }

      // Ordenamiento para datos mock
      filteredProperties.sort((a, b) => {
        const aValue = a[orderByRaw as keyof typeof a];
        const bValue = b[orderByRaw as keyof typeof b];

        if (safeAscending) {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Aplicar paginación a datos mock
      count = filteredProperties.length;
      items = filteredProperties.slice(offset, offset + limit);
    }

    // Responder preservando el contrato actual
    return NextResponse.json({
      items,
      count,
      meta: {
        dataSource: useSupabase ? 'supabase' : 'mock',
        filters: {
          city,
          province,
          propertyType,
          priceMin: !Number.isNaN(priceMin) ? priceMin : undefined,
          priceMax: !Number.isNaN(priceMax) ? priceMax : undefined,
          bedroomsMin: !Number.isNaN(bedroomsMin) ? bedroomsMin : undefined,
          bathroomsMin: !Number.isNaN(bathroomsMin) ? bathroomsMin : undefined
        },
        sorting: {
          orderBy: orderByRaw,
          order: safeAscending ? 'asc' : 'desc'
        },
        pagination: {
          limit,
          offset
        }
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
    
    // Validación mejorada con schema
    const validationResult = propertySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    const propertyData = validationResult.data;
    
    // Validaciones adicionales de negocio
    if (!propertyData.contact_phone) {
      return NextResponse.json(
        { 
          error: 'Contact phone is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Intentar usar Supabase primero
    const supabase = createServerSupabase();
    let useSupabase = true;
    let newProperty = null;

    try {
      // Obtener usuario actual (si está autenticado)
      const { data: { user } } = await supabase.auth.getUser();
      
      // Preparar datos para inserción
      const insertData = {
        ...propertyData,
        userId: user?.id || null,
        propertyType: propertyData.propertyType, // Mapear type a propertyType
        images: JSON.stringify(propertyData.images || []),
        amenities: JSON.stringify(propertyData.amenities || []),
        features: JSON.stringify(propertyData.features || []),
        contact_name: propertyData.contact_name || 'Sin nombre',
        contact_phone: propertyData.contact_phone,
        contact_email: propertyData.contact_email || '',
        country: propertyData.country || 'Argentina',
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Insertar en Supabase
      const { data: supabaseProperty, error } = await supabase
        .from('Property')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert error, using mock response:', error);
        useSupabase = false;
      } else {
        newProperty = supabaseProperty;
      }

    } catch (supabaseError) {
      console.warn('Supabase connection failed for POST, using mock response:', supabaseError);
      useSupabase = false;
    }

    // Fallback a respuesta mock si Supabase falla
    if (!useSupabase) {
      newProperty = {
        id: (mockProperties.length + 1).toString(),
        ...propertyData,
        propertyType: propertyData.propertyType,
        contact_name: propertyData.contact_name || 'Sin nombre',
        contact_phone: propertyData.contact_phone,
        contact_email: propertyData.contact_email || '',
        status: 'AVAILABLE',
        country: propertyData.country || 'Argentina',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Agregar a datos mock (solo en memoria)
      mockProperties.push(newProperty);
    }

    return NextResponse.json(
      { 
        message: 'Property created successfully',
        property: newProperty,
        meta: {
          dataSource: useSupabase ? 'supabase' : 'mock',
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
