// Mock data limpio - Sin propiedades de ejemplo
// La plataforma está lista para usuarios reales

export const mockProperties: any[] = [];

export const mockAgents: any[] = [];

// Función para filtrar propiedades según parámetros
export function filterProperties(params: {
  city?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  propertyType?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}) {
  let filtered = [...mockProperties];

  // Aplicar filtros
  if (params.city) {
    filtered = filtered.filter(p => 
      p.city.toLowerCase().includes(params.city!.toLowerCase())
    );
  }

  if (params.province) {
    filtered = filtered.filter(p => 
      p.province.toLowerCase().includes(params.province!.toLowerCase())
    );
  }

  if (params.minPrice) {
    filtered = filtered.filter(p => p.price >= params.minPrice!);
  }

  if (params.maxPrice) {
    filtered = filtered.filter(p => p.price <= params.maxPrice!);
  }

  if (params.minBedrooms) {
    filtered = filtered.filter(p => p.bedrooms >= params.minBedrooms!);
  }

  if (params.maxBedrooms) {
    filtered = filtered.filter(p => p.bedrooms <= params.maxBedrooms!);
  }

  if (params.minBathrooms) {
    filtered = filtered.filter(p => p.bathrooms >= params.minBathrooms!);
  }

  if (params.propertyType) {
    filtered = filtered.filter(p => p.propertyType === params.propertyType);
  }

  if (params.featured) {
    filtered = filtered.filter(p => p.featured === true);
  }

  // Paginación
  const page = params.page || 1;
  const limit = params.limit || 12;
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
export function getPropertyById(id: string) {
  return mockProperties.find(p => p.id === id);
}

// Función para obtener un agente por ID
export function getAgentById(id: string) {
  return mockAgents.find(a => a.id === id);
}
