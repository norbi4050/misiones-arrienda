import { Property, PropertyFilters, PropertyStatus } from '@/types/property';

// Función principal para obtener propiedades con filtros - LLAMA AL API REAL
export async function getProperties(filters: PropertyFilters & { page?: number; limit?: number } = {}) {
  try {
    // Construir query params para el API
    const params = new URLSearchParams();
    
    // Paginación
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    
    // Filtros de propiedad
    if (filters.city) params.set('city', filters.city);
    if (filters.province) params.set('province', filters.province);
    if (filters.propertyType) params.set('type', filters.propertyType);
    
    // Filtros de precio
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    
    // Filtros de habitaciones
    if (filters.minBedrooms) params.set('bedrooms', filters.minBedrooms.toString());
    if (filters.minBathrooms) params.set('bathrooms', filters.minBathrooms.toString());
    
    // Filtro de tipo de operación - FIX CRÍTICO
    if (filters.operationType) params.set('operation_type', filters.operationType);
    
    // Filtro de destacadas
    if (filters.featured !== undefined) params.set('featured', filters.featured.toString());
    
    // Llamar al API real
    // En servidor necesitamos URL absoluta, en cliente funciona la relativa
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000')
      : '';
    const url = `${baseUrl}/api/properties?${params.toString()}`;

    // En SSR, incluir las cookies de la request original
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Solo en server-side, incluir las cookies
    if (typeof window === 'undefined') {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      const cookieHeader = cookieStore.getAll()
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
      // Solo loguear error si NO es 401 (no autenticado es esperado para usuarios anónimos)
      if (response.status !== 401) {
        console.error(`API error: ${response.status}`);
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      properties: data.properties || [],
      pagination: data.pagination || {
        page: filters.page || 1,
        limit: filters.limit || 12,
        total: 0,
        totalPages: 0
      }
    };
  } catch (error) {
    console.error('Error fetching properties:', error);
    // Fallback en caso de error
    return {
      properties: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 12,
        total: 0,
        totalPages: 0
      }
    };
  }
}

// Función para obtener una propiedad por ID - Llama al API real
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    // En servidor necesitamos URL absoluta
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000')
      : '';

    // En SSR, incluir las cookies de la request original
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Solo en server-side, incluir las cookies
    if (typeof window === 'undefined') {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      const cookieHeader = cookieStore.getAll()
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }
    }

    const response = await fetch(`${baseUrl}/api/properties/${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.ok ? data.property : null;
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null;
  }
}

// Función legacy para compatibilidad
export async function fetchRealProperties(params: any): Promise<Property[]> {
  const result = await getProperties(params);
  return result.properties;
}
