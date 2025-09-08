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
    
    // Parámetros de búsqueda mejorados
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const amenities = searchParams.get('amenities');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Intentar conectar con Supabase primero
    const supabase = createServerSupabase();
    let useSupabase = true;
    let properties = [];
    let totalCount = 0;

    try {
      // Construir query de Supabase
      let query = supabase
        .from('Property')
        .select('*', { count: 'exact' })
      .eq('status', 'PUBLISHED')
      .eq('is_active', true);

      // Aplicar filtros avanzados
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

      if (minArea) {
        query = query.gte('area', parseFloat(minArea));
      }

      if (maxArea) {
        query = query.lte('area', parseFloat(maxArea));
      }

      // Ordenamiento
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar paginación
      const startIndex = (page - 1) * limit;
      query = query.range(startIndex, startIndex + limit - 1);

      const { data: supabaseProperties, error, count } = await query;

      if (error) {
        console.warn('Supabase error, falling back to mock data:', error);
        useSupabase = false;
      } else {
        properties = supabaseProperties || [];
        totalCount = count || 0;
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

      if (type) {
        filteredProperties = filteredProperties.filter(p => p.propertyType === type);
      }

      if (minPrice) {
        filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
      }

      if (maxPrice) {
        filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
      }

      if (bedrooms) {
        filteredProperties = filteredProperties.filter(p => p.bedrooms === parseInt(bedrooms));
      }

      if (bathrooms) {
        filteredProperties = filteredProperties.filter(p => p.bathrooms === parseInt(bathrooms));
      }

      if (minArea) {
        filteredProperties = filteredProperties.filter(p => p.area >= parseFloat(minArea));
      }

      if (maxArea) {
        filteredProperties = filteredProperties.filter(p => p.area <= parseFloat(maxArea));
      }

      if (amenities) {
        const amenityList = amenities.split(',');
        filteredProperties = filteredProperties.filter(p => 
          amenityList.some(amenity => p.amenities.includes(amenity.trim()))
        );
      }

      // Ordenamiento para datos mock
      filteredProperties.sort((a, b) => {
        const aValue = a[sortBy as keyof typeof a];
        const bValue = b[sortBy as keyof typeof b];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Aplicar paginación a datos mock
      totalCount = filteredProperties.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      properties = filteredProperties.slice(startIndex, endIndex);
    }

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      meta: {
        dataSource: useSupabase ? 'supabase' : 'mock',
        filters: {
          city,
          type,
          minPrice,
          maxPrice,
          bedrooms,
          bathrooms,
          minArea,
          maxArea,
          amenities
        },
        sorting: {
          sortBy,
          sortOrder
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
