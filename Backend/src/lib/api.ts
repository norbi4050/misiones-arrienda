import { Property, PropertyFilters, PropertyStatus } from '@/types/property';

// Array vacío - Sin propiedades de ejemplo para usuarios reales
const sampleProperties: Property[] = [];

// Función principal para obtener propiedades con filtros
export async function getProperties(filters: PropertyFilters & { page?: number; limit?: number } = {}) {
  try {
    // Build query parameters
    const params = new URLSearchParams();

    // Map filters to API parameters
    if (filters.city) params.set('city', filters.city);
    if (filters.province) params.set('province', filters.province);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.minPrice) params.set('priceMin', filters.minPrice.toString());
    if (filters.maxPrice) params.set('priceMax', filters.maxPrice.toString());
    if (filters.minBedrooms) params.set('bedroomsMin', filters.minBedrooms.toString());
    if (filters.minBathrooms) params.set('bathroomsMin', filters.minBathrooms.toString());
    if (filters.minArea) params.set('minArea', filters.minArea.toString());
    if (filters.maxArea) params.set('maxArea', filters.maxArea.toString());
    if (filters.amenities && Array.isArray(filters.amenities)) {
      params.set('amenities', JSON.stringify(filters.amenities));
    }
    if (filters.orderBy) params.set('orderBy', filters.orderBy);
    if (filters.order) params.set('order', filters.order);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const offset = (page - 1) * limit;

    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    // Call real API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/properties?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform response to match expected format
    return {
      properties: data.items || [],
      pagination: {
        page,
        limit,
        total: data.count || 0,
        pages: Math.ceil((data.count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching properties:', error);
    // Fallback to sample properties if API fails
    return {
      properties: sampleProperties,
      pagination: {
        page: 1,
        limit: 12,
        total: sampleProperties.length,
        pages: Math.ceil(sampleProperties.length / 12)
      }
    };
  }
}

// Función para obtener una propiedad por ID
export async function getPropertyById(id: string): Promise<Property | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return sampleProperties.find(p => p.id === id) || null;
}

// Función legacy para compatibilidad
export async function fetchRealProperties(params: any): Promise<Property[]> {
  // Filtrar el parámetro 'featured' que no es soportado por la API actual
  const { featured, ...validParams } = params || {};
  const result = await getProperties(validParams);
  return result.properties;
}
