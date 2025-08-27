import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para crear/actualizar perfil
const profileSchema = z.object({
  role: z.enum(['BUSCO', 'OFREZCO']),
  city: z.string().min(1),
  neighborhood: z.string().optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  bio: z.string().optional(),
  photos: z.array(z.string()).optional(),
  age: z.number().min(18).max(100).optional(),
  petPref: z.enum(['SI_PET', 'NO_PET', 'INDIFERENTE']).optional(),
  smokePref: z.enum(['FUMADOR', 'NO_FUMADOR', 'INDIFERENTE']).optional(),
  diet: z.enum(['NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO']).optional(),
  scheduleNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  acceptsMessages: z.boolean().optional()
})

// Schema para filtros de búsqueda
const searchSchema = z.object({
  role: z.enum(['BUSCO', 'OFREZCO']).optional(),
  city: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  petPref: z.enum(['SI_PET', 'NO_PET', 'INDIFERENTE']).optional(),
  smokePref: z.enum(['FUMADOR', 'NO_FUMADOR', 'INDIFERENTE']).optional(),
  diet: z.enum(['NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO']).optional(),
  tags: z.array(z.string()).optional(),
  highlightedFirst: z.boolean().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional()
})

// GET /api/comunidad/profiles - Listar perfiles con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parsear parámetros de búsqueda
    const params = {
      role: searchParams.get('role') || undefined,
      city: searchParams.get('city') || undefined,
      budgetMin: searchParams.get('budgetMin') ? parseInt(searchParams.get('budgetMin')!) : undefined,
      budgetMax: searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : undefined,
      petPref: searchParams.get('petPref') || undefined,
      smokePref: searchParams.get('smokePref') || undefined,
      diet: searchParams.get('diet') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      highlightedFirst: searchParams.get('highlightedFirst') === 'true',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    }

    // Validar parámetros
    const validatedParams = searchSchema.parse(params)

    // Construir filtros para Prisma
    const where: any = {
      isSuspended: false
    }

    if (validatedParams.role) {
      where.role = validatedParams.role
    }

    if (validatedParams.city) {
      where.city = {
        contains: validatedParams.city,
        mode: 'insensitive'
      }
    }

    if (validatedParams.budgetMin || validatedParams.budgetMax) {
      where.AND = []
      if (validatedParams.budgetMin) {
        where.AND.push({
          budgetMax: {
            gte: validatedParams.budgetMin
          }
        })
      }
      if (validatedParams.budgetMax) {
        where.AND.push({
          budgetMin: {
            lte: validatedParams.budgetMax
          }
        })
      }
    }

    if (validatedParams.petPref) {
      where.petPref = validatedParams.petPref
    }

    if (validatedParams.smokePref) {
      where.smokePref = validatedParams.smokePref
    }

    if (validatedParams.diet) {
      where.diet = validatedParams.diet
    }

    if (validatedParams.tags && validatedParams.tags.length > 0) {
      where.tags = {
        hasSome: validatedParams.tags
      }
    }

    // Configurar ordenamiento
    const orderBy: any[] = []
    
    if (validatedParams.highlightedFirst) {
      orderBy.push({
        highlightedUntil: {
          sort: 'desc',
          nulls: 'last'
        }
      })
    }
    
    orderBy.push({
      createdAt: 'desc'
    })

    // Calcular paginación
    const skip = (validatedParams.page - 1) * validatedParams.limit
    const take = validatedParams.limit

    // Ejecutar consulta
    const [profiles, total] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true,
              reviewCount: true
            }
          },
          rooms: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              title: true,
              price: true,
              type: true,
              photos: true
            }
          },
          _count: {
            select: {
              likesReceived: true
            }
          }
        }
      }),
      prisma.userProfile.count({ where })
    ])

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / validatedParams.limit)
    const hasNextPage = validatedParams.page < totalPages
    const hasPrevPage = validatedParams.page > 1

    return NextResponse.json({
      profiles,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Error fetching community profiles:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/comunidad/profiles - Crear/actualizar perfil del usuario autenticado
export async function POST(request: NextRequest) {
  try {
    // TODO: Implementar autenticación
    // const user = await getAuthenticatedUser(request)
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Por ahora, usar un usuario de ejemplo
    const userId = 'temp-user-id'

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Verificar si ya existe un perfil para este usuario
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    let profile
    if (existingProfile) {
      // Actualizar perfil existente
      profile = await prisma.userProfile.update({
        where: { userId },
        data: {
          ...validatedData,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true,
              reviewCount: true
            }
          },
          rooms: {
            where: {
              isActive: true
            }
          }
        }
      })
    } else {
      // Crear nuevo perfil
      profile = await prisma.userProfile.create({
        data: {
          userId,
          ...validatedData
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true,
              reviewCount: true
            }
          },
          rooms: {
            where: {
              isActive: true
            }
          }
        }
      })
    }

    return NextResponse.json(profile, { status: existingProfile ? 200 : 201 })

  } catch (error) {
    console.error('Error creating/updating community profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
