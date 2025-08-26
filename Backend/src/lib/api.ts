import { Property, PropertyFilters, PropertyStatus } from '@/types/property';

// Array vacío - Sin propiedades de ejemplo para usuarios reales
const sampleProperties: Property[] = [];

// Función principal para obtener propiedades con filtros
export async function getProperties(filters: PropertyFilters & { page?: number; limit?: number } = {}) {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let filtered = [...sampleProperties];

  // Aplicar filtros
  if (filters.city) {
    filtered = filtered.filter(p => 
      p.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }

  if (filters.province) {
    filtered = filtered.filter(p => 
      p.province.toLowerCase().includes(filters.province!.toLowerCase())
    );
  }

  if (filters.minPrice) {
    filtered = filtered.filter(p => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice) {
    filtered = filtered.filter(p => p.price <= filters.maxPrice!);
  }

  if (filters.minBedrooms) {
    filtered = filtered.filter(p => p.bedrooms >= filters.minBedrooms!);
  }

  if (filters.maxBedrooms) {
    filtered = filtered.filter(p => p.bedrooms <= filters.maxBedrooms!);
  }

  if (filters.minBathrooms) {
    filtered = filtered.filter(p => p.bathrooms >= filters.minBathrooms!);
  }

  if (filters.propertyType) {
    filtered = filtered.filter(p => p.propertyType === filters.propertyType);
  }

  if (filters.featured) {
    filtered = filtered.filter(p => p.featured === true);
  }

  // Paginación
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const total = filtered.length;
  const pages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const paginatedProperties = filtered.slice(skip, skip + limit);

  return {
    properties: paginatedProperties,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  };
}

// Función para obtener una propiedad por ID
export async function getPropertyById(id: string): Promise<Property | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return sampleProperties.find(p => p.id === id) || null;
}

// Función legacy para compatibilidad
export async function fetchRealProperties(params: any): Promise<Property[]> {
  const result = await getProperties(params);
  return result.properties;
}
