import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { propertySchema } from '@/lib/validations/property';
import { detectAuth, isPublicListingEnabled } from '@/lib/auth-detector';
import { maskPhone, limitArray, parseArrayField } from '@/lib/data-masking';

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


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
    images: ['/placeholder-house-1.jpg'],
    amenities: ['garage', 'garden'],
    contact_name: 'Juan Pérez',
    contact_phone: '+54 376 123456',
    contact_email: 'juan@example.com',
    status: 'AVAILABLE',
    featured: true,
    lat: -27.3676,
    lng: -55.8961,
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
    images: ['/placeholder-apartment-1.jpg'],
    amenities: ['pool', 'gym'],
    contact_name: 'María González',
    contact_phone: '+54 3757 987654',
    contact_email: 'maria@example.com',
    status: 'AVAILABLE',
    featured: false,
    lat: -25.5947,
    lng: -54.5734,
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
    images: ['/placeholder-house-2.jpg'],
    amenities: ['parking'],
    contact_name: 'Carlos Rodríguez',
    contact_phone: '+54 3755 456789',
    contact_email: 'carlos@example.com',
    status: 'AVAILABLE',
    featured: false,
    lat: -27.4878,
    lng: -55.1199,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  console.log('[API /properties] ===== REQUEST STARTED =====');
  console.log('[API /properties] URL:', request.url);

  try {
    const { searchParams } = new URL(request.url);

    // Parámetros de búsqueda mejorados + BBOX + operation_type
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const operationType = searchParams.get('operation_type'); // RENT, SALE, BOTH
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const amenities = searchParams.get('amenities');
    const featured = searchParams.get('featured');
    const bbox = searchParams.get('bbox'); // formato: minLng,minLat,maxLng,maxLat
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('[API /properties] Parsed params:', { city, type, operationType, featured, limit, page });

    // Parsear BBOX si existe
    let bboxCoords = null;
    if (bbox) {
      const coords = bbox.split(',').map(c => parseFloat(c));
      if (coords.length === 4 && coords.every(c => !isNaN(c))) {
        bboxCoords = {
          minLng: coords[0],
          minLat: coords[1], 
          maxLng: coords[2],
          maxLat: coords[3]
        };
      }
    }

    // Intentar conectar con Supabase primero
    const supabase = createClient();
    let useSupabase = true;
    let properties = [];
    let totalCount = 0;

    try {
      // Construir query de Supabase SIN JOIN para evitar errores
      const nowIso = new Date().toISOString();

      console.log('[API /properties] Building query with filters:', {
        city, type, operationType, featured, limit, page
      });

      // Test simple primero: ¿Puede leer ALGUNA propiedad?
      const { data: testData, error: testError, count: testCount } = await supabase
        .from('Property')
        .select('*', { count: 'exact' });

      console.log('[API /properties] TEST - Raw count without filters:', {
        testCount,
        testDataLength: testData?.length,
        testError: testError?.message
      });

      // DEBUG: Probar query simple primero
      console.log('[API /properties] Testing simple query...');
      const simpleTest = await supabase
        .from('Property')
        .select('*', { count: 'exact' })
        .eq('status', 'published');

      console.log('[API /properties] Simple test (only status):', {
        count: simpleTest.count,
        length: simpleTest.data?.length,
        error: simpleTest.error?.message
      });

      const withActiveTest = await supabase
        .from('Property')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .eq('is_active', true);

      console.log('[API /properties] With is_active test:', {
        count: withActiveTest.count,
        length: withActiveTest.data?.length,
        error: withActiveTest.error?.message
      });

      // DEBUG: Intentar sin filtros primero
      console.log('[API /properties] ATTEMPTING QUERY WITHOUT ANY FILTERS...');
      let query = supabase
        .from('Property')
        .select('*', { count: 'exact' });

      // NO aplicar filtros por ahora para ver si devuelve las 4 propiedades
      // .eq('status', 'published')
      // .eq('is_active', true);

      // Aplicar filtros avanzados
      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      if (type) {
        query = query.eq('propertyType', type); // camelCase en DB
      }

      // Filtro por tipo de operación (RENT, SALE, BOTH)
      if (operationType && operationType !== 'BOTH') {
        query = query.eq('operationType', operationType); // camelCase en DB
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

      if (featured === 'true') {
        query = query.eq('featured', true);
      }

      // Filtro por BBOX (coordenadas geográficas)
      if (bboxCoords) {
        query = query
          .gte('lng', bboxCoords.minLng)
          .lte('lng', bboxCoords.maxLng)
          .gte('lat', bboxCoords.minLat)
          .lte('lat', bboxCoords.maxLat);
      }

      // Orden por fecha de creación (usar createdAt que siempre existe)
      query = query.order('createdAt', { ascending: false });

      // Aplicar paginación
      const startIndex = (page - 1) * limit;
      query = query.range(startIndex, startIndex + limit - 1);

      const { data: supabaseProperties, error, count } = await query;

      console.log('[API /properties] Query result:', {
        count,
        propertiesLength: supabaseProperties?.length,
        hasError: !!error
      });

      if (error) {
        console.warn('Supabase error, falling back to mock data:', error);
        useSupabase = false;
      } else {
        properties = supabaseProperties || [];
        totalCount = count || 0;
        
        // Paso 3: Incluir cover_url en las respuestas de APIs de listado
        const BUCKET = process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images';
        const PLACEHOLDER = '/placeholder-apartment-1.jpg';

        const toCoverUrl = (coverPath?: string) => {
          if (!coverPath) return PLACEHOLDER;
          // URL pública del objeto (bucket público)
          const supabaseAdmin = createClient();
          const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(coverPath);
          return data.publicUrl || PLACEHOLDER;
        };

        // Agregar cover_url e imagesCount
        properties = properties.map((property: any) => {
          // Parsear images si viene como string JSON
          let imgs: string[] = [];
          try {
            if (typeof property.images === 'string') {
              imgs = JSON.parse(property.images);
            } else if (Array.isArray(property.images)) {
              imgs = property.images;
            }
          } catch {
            imgs = [];
          }
          
          return {
            ...property,
            cover_url: toCoverUrl(property.cover_path),
            imagesCount: imgs.length,
            // Owner info básico desde la propiedad misma
            owner_id: property.user_id || null,
            owner_type: null, // Se puede agregar después si es necesario
            owner_company_name: null
          };
        });
      }

    } catch (supabaseError) {
      console.warn('Supabase connection failed, using mock data:', supabaseError);
      useSupabase = false;
    }

    // Fallback a datos mock solo si el feature flag está habilitado
    if (!useSupabase && process.env.NEXT_PUBLIC_USE_MOCK_PROPERTIES === 'true') {
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

      if (featured === 'true') {
        filteredProperties = filteredProperties.filter(p => p.featured === true);
      }

      // Filtro por operation_type para datos mock
      if (operationType && operationType !== 'BOTH') {
        // Mock data no tiene operationType, asumir BOTH para todos
        // En producción real, esto filtraría correctamente
      }

      // Filtro por BBOX para datos mock (usando coordenadas incluidas)
      if (bboxCoords) {
        filteredProperties = filteredProperties.filter(p => {
          return p.lng >= bboxCoords.minLng && 
                 p.lng <= bboxCoords.maxLng &&
                 p.lat >= bboxCoords.minLat && 
                 p.lat <= bboxCoords.maxLat;
        });
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
    } else if (!useSupabase) {
      // Si Supabase falla y no hay flag de mock, devolver vacío
      properties = [];
      totalCount = 0;
    }

    // ========================================
    // FEATURE: Public Property Listing
    // Adaptar response según estado de autenticación
    // ========================================
    const publicListingEnabled = isPublicListingEnabled();

    if (publicListingEnabled) {
      try {
        // Detectar si el usuario está autenticado
        const authContext = await detectAuth(request);

        // Si NO está autenticado, enmascarar datos sensibles
        if (!authContext.isAuthenticated) {
          properties = properties.map((property: any) => {
            // Parsear imágenes
            const images = parseArrayField(property.images);
            const totalImages = images.length;

            return {
              ...property,
              // Enmascarar contacto
              contact_phone: maskPhone(property.contact_phone),
              contact_email: null, // Ocultar completamente
              contact_name: null,  // Ocultar completamente

              // Limitar imágenes a 3
              images: limitArray(images, 3),
              imagesCount: totalImages, // Mantener count real

              // Flags para el frontend
              requires_auth_for_contact: true,
              requires_auth_for_full_images: totalImages > 3
            };
          });
        } else {
          // Usuario autenticado: agregar flags en false
          properties = properties.map((property: any) => ({
            ...property,
            requires_auth_for_contact: false,
            requires_auth_for_full_images: false
          }));
        }
      } catch (authError) {
        console.error('[API /properties] Auth detection failed, treating as anonymous:', authError);
        // En caso de error, tratar como anónimo y no enmascarar datos
        // (el feature flag está en false, así que esto no afecta)
      }
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
          operationType,
          minPrice,
          maxPrice,
          bedrooms,
          bathrooms,
          minArea,
          maxArea,
          amenities,
          featured,
          bbox: bboxCoords
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

export async function POST() {
  return NextResponse.json(
    { error: 'Usá /api/properties/draft para crear un borrador y /api/properties/[id]/publish para publicar.' },
    { status: 405 }
  );
}

// Función auxiliar para obtener coordenadas mock de ciudades de Misiones
function getMockCoordinates(city: string): { lat: number; lng: number } | null {
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'Posadas': { lat: -27.3676, lng: -55.8961 },
    'Puerto Iguazú': { lat: -25.5947, lng: -54.5734 },
    'Oberá': { lat: -27.4878, lng: -55.1199 },
    'Eldorado': { lat: -26.4009, lng: -54.6156 },
    'Leandro N. Alem': { lat: -27.6011, lng: -55.3206 }
  };
  
  return cityCoords[city] || null;
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

  const bbox = searchParams.get('bbox');
  if (bbox) {
    const coords = bbox.split(',').map(c => parseFloat(c));
    if (coords.length !== 4 || coords.some(c => isNaN(c))) {
      errors.push('BBOX must be in format: minLng,minLat,maxLng,maxLat');
    }
  }
  
  return errors;
}
