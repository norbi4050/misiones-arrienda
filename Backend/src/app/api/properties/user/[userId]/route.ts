import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticación del usuario
    const authenticatedUser = await getAuthenticatedUser(req)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { userId } = params

    // Verificar que el usuario autenticado puede acceder a estas propiedades
    // Solo puede ver sus propias propiedades
    if (authenticatedUser.id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver estas propiedades' },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const propertyType = searchParams.get('propertyType')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Construir filtros - usar el campo correcto del esquema
    const where: any = {}

    // Filtrar por el campo que existe en el esquema
    // Como no podemos usar userId directamente, buscaremos todas las propiedades
    // y filtraremos por el usuario autenticado en el código

    if (status) {
      where.status = status
    }

    if (propertyType) {
      where.propertyType = propertyType
    }

    // Construir ordenamiento
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Calcular offset para paginación
    const skip = (page - 1) * limit

    // Obtener todas las propiedades y filtrar por userId después
    const allProperties = await prisma.property.findMany({
      where,
      orderBy,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Filtrar propiedades por userId (asumiendo que existe en el objeto)
    const userProperties = allProperties.filter((property: any) => 
      property.userId === userId
    )

    // Aplicar paginación manualmente
    const totalCount = userProperties.length
    const paginatedProperties = userProperties.slice(skip, skip + limit)

    // Procesar las propiedades para incluir información adicional
    const processedProperties = paginatedProperties.map(property => {
      // Parsear campos JSON
      let images = []
      let amenities = []
      let features = []

      try {
        images = JSON.parse(property.images)
      } catch (e) {
        images = []
      }

      try {
        amenities = JSON.parse(property.amenities)
      } catch (e) {
        amenities = []
      }

      try {
        features = JSON.parse(property.features)
      } catch (e) {
        features = []
      }

      return {
        id: property.id,
        title: property.title,
        description: property.description,
        price: property.price,
        oldPrice: property.oldPrice,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        garages: property.garages,
        area: property.area,
        lotArea: property.lotArea,
        address: property.address,
        city: property.city,
        province: property.province,
        postalCode: property.postalCode,
        latitude: property.latitude,
        longitude: property.longitude,
        propertyType: property.propertyType,
        status: property.status,
        featured: property.featured,
        yearBuilt: property.yearBuilt,
        floor: property.floor,
        totalFloors: property.totalFloors,
        virtualTourUrl: property.virtualTourUrl,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        userId: (property as any).userId,
        
        // Campos procesados
        images,
        amenities,
        features,
        
        // Información del agente
        agent: property.agent,
        
        // Plan básico por defecto
        activePlan: { planType: 'basico', planName: 'Plan Básico' }
      }
    })

    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Obtener estadísticas básicas
    const summary = await getBasicSummary(userId, userProperties)

    return NextResponse.json({
      success: true,
      data: {
        properties: processedProperties,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        summary: {
          totalProperties: totalCount,
          ...summary
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user properties:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Función auxiliar para obtener estadísticas básicas
async function getBasicSummary(userId: string, properties: any[]) {
  try {
    // Calcular estadísticas desde las propiedades filtradas
    const byStatus = properties.reduce((acc, property) => {
      acc[property.status] = (acc[property.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byType = properties.reduce((acc, property) => {
      acc[property.propertyType] = (acc[property.propertyType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      byStatus,
      byType,
      totalInquiries: 0, // Por ahora 0, se puede implementar después
      totalFavorites: 0  // Por ahora 0, se puede implementar después
    }
  } catch (error) {
    console.error('Error getting basic summary:', error)
    return {
      byStatus: {},
      byType: {},
      totalInquiries: 0,
      totalFavorites: 0
    }
  }
}
