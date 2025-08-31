import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing
const mockProperties = [
  {
    id: '1',
    title: 'Casa en Posadas Centro',
    description: 'Hermosa casa de 3 dormitorios en el centro de Posadas',
    price: 150000,
    currency: 'ARS',
    type: 'HOUSE',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Departamento en Puerto Iguazú',
    description: 'Moderno departamento de 2 dormitorios cerca de las Cataratas',
    price: 120000,
    currency: 'ARS',
    type: 'APARTMENT',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Local Comercial en Oberá',
    description: 'Amplio local comercial en zona céntrica de Oberá',
    price: 80000,
    currency: 'ARS',
    type: 'COMMERCIAL',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Filter properties based on search parameters
    let filteredProperties = [...mockProperties];

    if (city) {
      filteredProperties = filteredProperties.filter(p => 
        p.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (type) {
      filteredProperties = filteredProperties.filter(p => p.type === type);
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

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    return NextResponse.json({
      properties: paginatedProperties,
      pagination: {
        page,
        limit,
        total: filteredProperties.length,
        totalPages: Math.ceil(filteredProperties.length / limit)
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

    // Basic validation
    if (!title || !price || !type || !city || !contact_phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new property (mock)
    const newProperty = {
      id: (mockProperties.length + 1).toString(),
      title,
      description,
      price: parseFloat(price),
      currency,
      type,
      bedrooms: bedrooms ? parseInt(bedrooms) : 0,
      bathrooms: bathrooms ? parseInt(bathrooms) : 0,
      area: area ? parseFloat(area) : 0,
      address,
      city,
      province: province || 'Misiones',
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
      status: 'AVAILABLE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to mock data (in memory only)
    mockProperties.push(newProperty);

    return NextResponse.json(
      { 
        message: 'Property created successfully',
        property: newProperty
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
