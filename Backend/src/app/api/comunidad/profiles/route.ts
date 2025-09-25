import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { COMMUNITY_ROLES, type CommunityRole } from '@/domain/user/roles'

// Schema de validación para crear/actualizar perfil
const profileSchema = z.object({
  role: z.enum(COMMUNITY_ROLES),
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
  role: z.enum(COMMUNITY_ROLES).optional(),
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

// Mock data para demostración
const mockProfiles = [
  {
    id: '1',
    role: 'BUSCO',
    city: 'Posadas',
    neighborhood: 'Centro',
    budgetMin: 120000,
    budgetMax: 180000,
    bio: 'Estudiante de medicina, busco habitación tranquila cerca de la universidad.',
    age: 22,
    petPref: 'SI_PET',
    smokePref: 'NO_FUMADOR',
    diet: 'VEGETARIANO',
    tags: ['estudiante', 'ordenado', 'responsable'],
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'],
    user: {
      id: '1',
      name: 'María González',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      rating: 4.8,
      reviewCount: 12
    },
    createdAt: new Date('2024-01-15'),
    likesCount: 8
  },
  {
    id: '2',
    role: 'OFREZCO',
    city: 'Oberá',
    neighborhood: 'Villa Bonita',
    budgetMin: 100000,
    budgetMax: 150000,
    bio: 'Tengo una casa grande, busco compañeros responsables para compartir.',
    age: 32,
    petPref: 'INDIFERENTE',
    smokePref: 'NO_FUMADOR',
    diet: 'NINGUNA',
    tags: ['propietario', 'familiar', 'acogedor'],
    photos: ['https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face'],
    user: {
      id: '2',
      name: 'Carlos Mendoza',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      rating: 4.9,
      reviewCount: 25
    },
    createdAt: new Date('2024-01-10'),
    likesCount: 15
  }
]

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

    // Filtrar mock data
    let filteredProfiles = mockProfiles

    if (validatedParams.role) {
      filteredProfiles = filteredProfiles.filter(p => p.role === validatedParams.role)
    }

    if (validatedParams.city) {
      filteredProfiles = filteredProfiles.filter(p => 
        p.city.toLowerCase().includes(validatedParams.city!.toLowerCase())
      )
    }

    // Calcular paginación
    const page = validatedParams.page ?? 1
    const limit = validatedParams.limit ?? 20
    const total = filteredProfiles.length
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit
    const profiles = filteredProfiles.slice(skip, skip + limit)

    return NextResponse.json({
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
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
    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Simular creación de perfil
    const newProfile = {
      id: Date.now().toString(),
      ...validatedData,
      user: {
        id: 'temp-user-id',
        name: 'Usuario Temporal',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        rating: 5.0,
        reviewCount: 0
      },
      createdAt: new Date(),
      likesCount: 0
    }

    return NextResponse.json(newProfile, { status: 201 })

  } catch (error) {
    console.error('Error creating community profile:', error)
    
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
