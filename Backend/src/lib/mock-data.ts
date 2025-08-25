// Mock data para reemplazar la base de datos en producción
export const mockProperties = [
  {
    id: "1",
    title: "Casa familiar en Eldorado",
    description: "Hermosa casa familiar de 3 dormitorios con amplio jardín y piscina. Ubicada en zona residencial tranquila de Eldorado, ideal para familias.",
    price: 320000,
    propertyType: "HOUSE",
    status: "AVAILABLE",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    lotSize: 800,
    address: "Av. San Martín 1234",
    city: "Eldorado",
    province: "Misiones",
    zipCode: "3380",
    latitude: -26.4013,
    longitude: -54.6142,
    featured: true,
    images: [
      "/placeholder-house-1.jpg",
      "/placeholder-house-2.jpg"
    ],
    amenities: ["Piscina", "Jardín", "Garage", "Parrilla"],
    features: ["Aire acondicionado", "Calefacción", "Internet"],
    yearBuilt: 2018,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    agent: {
      id: "1",
      name: "María González",
      email: "maria@misionesarrienda.com.ar",
      phone: "+54 376 123-4567",
      avatar: "/agent-maria.jpg",
      rating: 4.8
    }
  },
  {
    id: "2",
    title: "Departamento moderno en Posadas",
    description: "Moderno departamento de 2 dormitorios en el centro de Posadas. Excelente ubicación cerca de comercios y transporte público.",
    price: 180000,
    propertyType: "APARTMENT",
    status: "AVAILABLE",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    lotSize: null,
    address: "Calle Córdoba 567",
    city: "Posadas",
    province: "Misiones",
    zipCode: "3300",
    latitude: -27.3621,
    longitude: -55.8981,
    featured: true,
    images: [
      "/placeholder-apartment-1.jpg",
      "/placeholder-apartment-2.jpg"
    ],
    amenities: ["Balcón", "Portero", "Ascensor"],
    features: ["Aire acondicionado", "Internet", "Cable"],
    yearBuilt: 2020,
    createdAt: "2024-01-14T15:30:00Z",
    updatedAt: "2024-01-14T15:30:00Z",
    agent: {
      id: "2",
      name: "Carlos Rodríguez",
      email: "carlos@misionesarrienda.com.ar",
      phone: "+54 376 987-6543",
      avatar: "/agent-carlos.jpg",
      rating: 4.9
    }
  },
  {
    id: "3",
    title: "Casa con piscina en Posadas",
    description: "Amplia casa de 4 dormitorios con piscina y quincho. Perfecta para entretenimiento y vida familiar en Posadas.",
    price: 450000,
    propertyType: "HOUSE",
    status: "AVAILABLE",
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    lotSize: 1200,
    address: "Barrio Villa Cabello",
    city: "Posadas",
    province: "Misiones",
    zipCode: "3300",
    latitude: -27.3895,
    longitude: -55.9213,
    featured: false,
    images: [
      "/placeholder-house-1.jpg",
      "/placeholder-house-2.jpg"
    ],
    amenities: ["Piscina", "Quincho", "Garage doble", "Jardín amplio"],
    features: ["Aire acondicionado", "Calefacción", "Internet", "Alarma"],
    yearBuilt: 2019,
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
    agent: {
      id: "1",
      name: "María González",
      email: "maria@misionesarrienda.com.ar",
      phone: "+54 376 123-4567",
      avatar: "/agent-maria.jpg",
      rating: 4.8
    }
  },
  {
    id: "4",
    title: "Departamento céntrico",
    description: "Cómodo departamento de 1 dormitorio en pleno centro de Posadas. Ideal para profesionales o estudiantes.",
    price: 120000,
    propertyType: "APARTMENT",
    status: "AVAILABLE",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    lotSize: null,
    address: "Av. Mitre 890",
    city: "Posadas",
    province: "Misiones",
    zipCode: "3300",
    latitude: -27.3676,
    longitude: -55.8959,
    featured: false,
    images: [
      "/placeholder-apartment-1.jpg"
    ],
    amenities: ["Balcón", "Portero"],
    features: ["Internet", "Cable"],
    yearBuilt: 2015,
    createdAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-12T14:20:00Z",
    agent: {
      id: "2",
      name: "Carlos Rodríguez",
      email: "carlos@misionesarrienda.com.ar",
      phone: "+54 376 987-6543",
      avatar: "/agent-carlos.jpg",
      rating: 4.9
    }
  },
  {
    id: "5",
    title: "Casa quinta en Eldorado",
    description: "Hermosa casa quinta con amplio terreno y frutales. Perfecta para descanso y contacto con la naturaleza.",
    price: 280000,
    propertyType: "HOUSE",
    status: "AVAILABLE",
    bedrooms: 2,
    bathrooms: 2,
    area: 120,
    lotSize: 2000,
    address: "Ruta Provincial 17 Km 8",
    city: "Eldorado",
    province: "Misiones",
    zipCode: "3380",
    latitude: -26.4156,
    longitude: -54.6298,
    featured: false,
    images: [
      "/placeholder-house-1.jpg"
    ],
    amenities: ["Jardín amplio", "Frutales", "Pozo de agua"],
    features: ["Tranquilidad", "Aire puro"],
    yearBuilt: 2010,
    createdAt: "2024-01-11T11:45:00Z",
    updatedAt: "2024-01-11T11:45:00Z",
    agent: {
      id: "1",
      name: "María González",
      email: "maria@misionesarrienda.com.ar",
      phone: "+54 376 123-4567",
      avatar: "/agent-maria.jpg",
      rating: 4.8
    }
  },
  {
    id: "6",
    title: "Departamento con vista al río",
    description: "Exclusivo departamento de 3 dormitorios con vista panorámica al río Paraná. Ubicación premium en Posadas.",
    price: 350000,
    propertyType: "APARTMENT",
    status: "AVAILABLE",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    lotSize: null,
    address: "Costanera Sur 456",
    city: "Posadas",
    province: "Misiones",
    zipCode: "3300",
    latitude: -27.3598,
    longitude: -55.8876,
    featured: true,
    images: [
      "/placeholder-apartment-1.jpg",
      "/placeholder-apartment-2.jpg",
      "/placeholder-apartment-3.jpg"
    ],
    amenities: ["Vista al río", "Balcón amplio", "Portero 24hs", "Piscina del edificio"],
    features: ["Aire acondicionado", "Calefacción", "Internet", "Cable premium"],
    yearBuilt: 2021,
    createdAt: "2024-01-10T16:00:00Z",
    updatedAt: "2024-01-10T16:00:00Z",
    agent: {
      id: "2",
      name: "Carlos Rodríguez",
      email: "carlos@misionesarrienda.com.ar",
      phone: "+54 376 987-6543",
      avatar: "/agent-carlos.jpg",
      rating: 4.9
    }
  }
];

export const mockAgents = [
  {
    id: "1",
    name: "María González",
    email: "maria@misionesarrienda.com.ar",
    phone: "+54 376 123-4567",
    avatar: "/agent-maria.jpg",
    rating: 4.8,
    specialization: "Propiedades residenciales",
    experience: "8 años de experiencia",
    description: "Especialista en propiedades familiares y residenciales en Misiones."
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    email: "carlos@misionesarrienda.com.ar",
    phone: "+54 376 987-6543",
    avatar: "/agent-carlos.jpg",
    rating: 4.9,
    specialization: "Propiedades comerciales",
    experience: "12 años de experiencia",
    description: "Experto en propiedades comerciales y departamentos en Posadas."
  }
];

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
