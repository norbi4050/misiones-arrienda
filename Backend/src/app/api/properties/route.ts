import { NextRequest, NextResponse } from 'next/server'

// Mock data for testing - simulating real properties from Misiones
let mockProperties = [
  {
    id: '1',
    userId: 'user1',
    title: 'Casa moderna en Posadas centro',
    description: 'Hermosa casa de 3 dormitorios en el centro de Posadas',
    city: 'Posadas',
    province: 'Misiones',
    price: 150000,
    propertyType: 'HOUSE',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    images: ['/placeholder-house-1.jpg'],
    amenities: ['parking', 'garden', 'pool'],
    status: 'AVAILABLE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'user2',
    title: 'Departamento céntrico en Oberá',
    description: 'Departamento de 2 dormitorios en zona céntrica',
    city: 'Oberá',
    province: 'Misiones',
    price: 80000,
    propertyType: 'APARTMENT',
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    images: ['/placeholder-apartment-1.jpg'],
    amenities: ['elevator', 'security'],
    status: 'AVAILABLE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    userId: 'user3',
    title: 'Casa con vista al río en Puerto Iguazú',
    description: 'Casa familiar con hermosa vista al río Paraná',
    city: 'Puerto Iguazú',
    province: 'Misiones',
    price: 200000,
    propertyType: 'HOUSE',
    bedrooms: 4,
    bathrooms: 3,
    area: 180,
    images: ['/placeholder-house-2.jpg'],
    amenities: ['parking', 'garden', 'river_view'],
    status: 'AVAILABLE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    userId: 'user4',
    title: 'Departamento nuevo en Eldorado',
    description: 'Departamento a estrenar en Eldorado',
    city: 'Eldorado',
    province: 'Misiones',
    price: 95000,
    propertyType: 'APARTMENT',
    bedrooms: 2,
    bathrooms: 2,
    area: 70,
    images: ['/placeholder-apartment-2.jpg'],
    amenities: ['parking', 'security', 'gym'],
    status: 'AVAILABLE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const params = url.searchParams

    // Parse filters
    const city = params.get('city') || ''
    const province = params.get('province') || ''
    const propertyType = params.get('propertyType') || ''
    const priceMin = params.get('priceMin') ? Number(params.get('priceMin')) : null
    const priceMax = params.get('priceMax') ? Number(params.get('priceMax')) : null
    const bedrooms = params.get('bedrooms') ? Number(params.get('bedrooms')) : null
    const bedroomsMin = params.get('bedroomsMin') ? Number(params.get('bedroomsMin')) : null
    const bathroomsMin = params.get('bathroomsMin') ? Number(params.get('bathroomsMin')) : null
    const minArea = params.get('minArea') ? Number(params.get('minArea')) : null
    const maxArea = params.get('maxArea') ? Number(params.get('maxArea')) : null
    const amenitiesCsv = params.get('amenities') || ''
    const amenities = amenitiesCsv ? amenitiesCsv.split(',').map(a => a.trim()) : []

    // Sorting and pagination
    const orderBy = params.get('orderBy') || 'createdAt'
    const order = params.get('order') || 'desc'
    const limit = params.get('limit') ? Number(params.get('limit')) : 10
    const offset = params.get('offset') ? Number(params.get('offset')) : 0

    // Filter mock data
    let filteredProperties = mockProperties.filter(prop => {
      if (city && !prop.city.toLowerCase().includes(city.toLowerCase())) return false
      if (province && !prop.province.toLowerCase().includes(province.toLowerCase())) return false
      if (propertyType && prop.propertyType !== propertyType) return false
      if (priceMin !== null && prop.price < priceMin) return false
      if (priceMax !== null && prop.price > priceMax) return false
      if (bedrooms !== null && prop.bedrooms !== bedrooms) return false
      if (bedroomsMin !== null && prop.bedrooms < bedroomsMin) return false
      if (bathroomsMin !== null && prop.bathrooms < bathroomsMin) return false
      if (minArea !== null && prop.area < minArea) return false
      if (maxArea !== null && prop.area > maxArea) return false
      if (amenities.length > 0 && !amenities.every(a => prop.amenities.includes(a))) return false
      return true
    })

    // Apply sorting
    filteredProperties.sort((a: any, b: any) => {
      let aVal = a[orderBy]
      let bVal = b[orderBy]
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })

    // Apply pagination
    const paginatedProperties = filteredProperties.slice(offset, offset + limit)

    return NextResponse.json({
      items: paginatedProperties,
      count: filteredProperties.length,
      meta: {
        dataSource: 'mock',
        filters: { city, province, propertyType, priceMin, priceMax, bedrooms, bedroomsMin, bathroomsMin, minArea, maxArea, amenities },
        sorting: { orderBy, order },
        pagination: { limit, offset }
      }
    })
  } catch (error) {
    console.error('Error in /api/properties:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar campos requeridos
    const requiredFields = ['title', 'description', 'price', 'propertyType', 'address', 'city', 'user_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos requeridos faltantes: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Crear nueva propiedad
    const newProperty = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: body.user_id,
      title: body.title,
      description: body.description,
      city: body.city,
      province: body.province || 'Misiones',
      country: body.country || 'Argentina',
      address: body.address,
      postalCode: body.postalCode || '',
      price: Number(body.price),
      currency: body.currency || 'ARS',
      propertyType: body.propertyType,
      bedrooms: Number(body.bedrooms) || 0,
      bathrooms: Number(body.bathrooms) || 0,
      garages: Number(body.garages) || 0,
      area: Number(body.area) || 0,
      images: body.images || [],
      amenities: body.amenities || [],
      features: body.features || [],
      servicios: body.servicios || [],
      mascotas: Boolean(body.mascotas),
      expensasIncl: Boolean(body.expensasIncl),
      status: body.status || 'AVAILABLE',
      isActive: true,
      featured: Boolean(body.featured),
      contact_name: body.contact_name || '',
      contact_email: body.contact_email || '',
      contact_phone: body.contact_phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Agregar a la lista de propiedades mock
    mockProperties.push(newProperty)

    console.log('Nueva propiedad creada:', {
      id: newProperty.id,
      title: newProperty.title,
      city: newProperty.city,
      price: newProperty.price
    })

    return NextResponse.json({
      success: true,
      property: newProperty,
      message: 'Propiedad creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating property:', error)
    
    // Si el error es de parsing JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de datos inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al crear la propiedad' },
      { status: 500 }
    )
  }
}
