import { Property, PropertyFilters, PropertyStatus } from '@/types/property';

// Propiedades de ejemplo para SEO y renderizado inicial
const sampleProperties: Property[] = [
  {
    id: "1",
    title: "Casa en Posadas Centro",
    description: "Hermosa casa de 3 dormitorios en el centro de Posadas, cerca de todos los servicios.",
    price: 85000,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    area: 120,
    address: "Av. Mitre 1234",
    city: "Posadas",
    province: "Misiones",
    postalCode: "3300",
    propertyType: "HOUSE",
    listingType: "SALE",
    status: "AVAILABLE" as PropertyStatus,
    images: ["/placeholder-apartment-1.jpg", "/placeholder-apartment-2.jpg"],
    amenities: ["Jardín", "Parrilla", "Cochera"],
    features: ["Aire acondicionado", "Calefacción", "Alarma"],
    featured: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    agent: {
      id: "agent1",
      name: "María González",
      email: "maria@misionesarrienda.com.ar",
      phone: "+54 376 123-4567",
      rating: 4.8,
    },
  },
  {
    id: "2",
    title: "Departamento en Oberá",
    description: "Moderno departamento de 2 dormitorios en Oberá, ideal para parejas jóvenes.",
    price: 45000,
    bedrooms: 2,
    bathrooms: 1,
    garages: 1,
    area: 65,
    address: "Calle Libertad 567",
    city: "Oberá",
    province: "Misiones",
    postalCode: "3360",
    propertyType: "APARTMENT",
    listingType: "RENT",
    status: "AVAILABLE" as PropertyStatus,
    images: ["/placeholder-apartment-2.jpg", "/placeholder-apartment-3.jpg"],
    amenities: ["Balcón", "Lavadero"],
    features: ["Aire acondicionado", "Amoblado"],
    featured: true,
    createdAt: "2024-01-16T10:00:00Z",
    updatedAt: "2024-01-16T10:00:00Z",
    agent: {
      id: "agent2",
      name: "Carlos Rodríguez",
      email: "carlos@misionesarrienda.com.ar",
      phone: "+54 376 987-6543",
      rating: 4.6,
    },
  },
  {
    id: "3",
    title: "Casa en Eldorado",
    description: "Amplia casa familiar en Eldorado con gran patio y quincho.",
    price: 75000,
    bedrooms: 4,
    bathrooms: 2,
    garages: 2,
    area: 180,
    address: "Calle San Martín 890",
    city: "Eldorado",
    province: "Misiones",
    postalCode: "3380",
    propertyType: "HOUSE",
    listingType: "SALE",
    status: "AVAILABLE" as PropertyStatus,
    images: ["/placeholder-apartment-3.jpg", "/placeholder-apartment-1.jpg"],
    amenities: ["Quincho", "Piscina", "Jardín amplio"],
    features: ["Calefacción", "Aire acondicionado", "Portón automático"],
    featured: true,
    createdAt: "2024-01-17T10:00:00Z",
    updatedAt: "2024-01-17T10:00:00Z",
    agent: {
      id: "agent3",
      name: "Ana Martínez",
      email: "ana@misionesarrienda.com.ar",
      phone: "+54 376 456-7890",
      rating: 4.9,
    },
  },
  {
    id: "4",
    title: "Local Comercial en Puerto Iguazú",
    description: "Excelente local comercial en zona turística de Puerto Iguazú.",
    price: 120000,
    bedrooms: 0,
    bathrooms: 1,
    garages: 0,
    area: 80,
    address: "Av. Victoria Aguirre 234",
    city: "Puerto Iguazú",
    province: "Misiones",
    postalCode: "3370",
    propertyType: "COMMERCIAL",
    listingType: "RENT",
    status: "AVAILABLE" as PropertyStatus,
    images: ["/placeholder-apartment-2.jpg"],
    amenities: ["Vidriera", "Depósito"],
    features: ["Aire acondicionado", "Alarma", "Acceso discapacitados"],
    featured: false,
    createdAt: "2024-01-18T10:00:00Z",
    updatedAt: "2024-01-18T10:00:00Z",
    agent: {
      id: "agent1",
      name: "María González",
      email: "maria@misionesarrienda.com.ar",
      phone: "+54 376 123-4567",
      rating: 4.8,
    },
  },
  {
    id: "5",
    title: "Departamento en Posadas - Zona Sur",
    description: "Departamento de 1 dormitorio en zona sur de Posadas, ideal para estudiantes.",
    price: 25000,
    bedrooms: 1,
    bathrooms: 1,
    garages: 0,
    area: 45,
    address: "Calle Jujuy 456",
    city: "Posadas",
    province: "Misiones",
    postalCode: "3300",
    propertyType: "APARTMENT",
    listingType: "RENT",
    status: "AVAILABLE" as PropertyStatus,
    images: ["/placeholder-apartment-1.jpg"],
    amenities: ["Balcón"],
    features: ["Aire acondicionado"],
    featured: false,
    createdAt: "2024-01-19T10:00:00Z",
    updatedAt: "2024-01-19T10:00:00Z",
    agent: {
      id: "agent2",
      name: "Carlos Rodríguez",
      email: "carlos@misionesarrienda.com.ar",
      phone: "+54 376 987-6543",
      rating: 4.6,
    },
  },
  {
    id: "6",
    title: "Casa en Leandro N. Alem",
    description: "Casa de 3 dormitorios en Leandro N. Alem, con amplio terreno.",
    price: 65000,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    area: 140,
    address: "Calle Belgrano 123",
    city: "Leandro N. Alem",
    province: "Misiones",
    postalCode: "3315",
    propertyType: "HOUSE",
    listingType: "SALE",
    status: "AVAILABLE" as PropertyStatus,
    images: ["/placeholder-apartment-3.jpg", "/placeholder-apartment-2.jpg"],
    amenities: ["Jardín", "Parrilla", "Huerta"],
    features: ["Calefacción", "Pozo de agua"],
    featured: true,
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
    agent: {
      id: "agent3",
      name: "Ana Martínez",
      email: "ana@misionesarrienda.com.ar",
      phone: "+54 376 456-7890",
      rating: 4.9,
    },
  }
];

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
