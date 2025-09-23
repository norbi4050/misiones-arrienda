import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllProfiles, addProfile, getNextId, findProfileById, type MockProfile } from '@/lib/mock-community-profiles'
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { extractUserName } from '@/lib/user-utils'

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

    // Obtener perfiles del mock data compartido
    let filteredProfiles = getAllProfiles()

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

async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    }
  )
}

// POST /api/comunidad/profiles - Crear/actualizar perfil del usuario autenticado
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await getServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Obtener datos del perfil del usuario directamente desde Supabase
    let userProfile
    try {
      const { data: dbProfile, error: dbError } = await supabase
        .from('users')
        .select('id, name, email, phone, bio, avatar')
        .eq('id', user.id)
        .single()

      if (!dbError && dbProfile) {
        userProfile = dbProfile
      }
    } catch (error) {
      console.log('No se pudo obtener perfil del usuario desde BD, usando datos básicos')
    }

    // Usar datos del usuario autenticado o fallback
    const userName = userProfile?.name || extractUserName(user) || 'Usuario'
    const userAvatar = userProfile?.avatar || user.user_metadata?.avatar_url || null // ✅ Usar avatar de auth si no hay en BD
    
    // Verificar si ya existe un anuncio para este usuario
    const existingProfile = findProfileById(user.id)
    
    if (existingProfile) {
      return NextResponse.json(
        { error: "Ya tienes un anuncio publicado. Solo puedes tener uno activo." },
        { status: 409 }
      )
    }

    // Crear nuevo perfil vinculado al usuario real
    const newProfile: MockProfile = {
      id: user.id, // ✅ Usar ID real del usuario autenticado
      role: validatedData.role,
      city: validatedData.city,
      neighborhood: validatedData.neighborhood || '',
      budgetMin: validatedData.budgetMin,
      budgetMax: validatedData.budgetMax,
      bio: validatedData.bio || '',
      age: validatedData.age || 25,
      petPref: validatedData.petPref || 'INDIFERENTE',
      smokePref: validatedData.smokePref || 'INDIFERENTE',
      diet: validatedData.diet || 'NINGUNA',
      scheduleNotes: validatedData.scheduleNotes || '',
      tags: validatedData.tags || [],
      photos: validatedData.photos || [],
      acceptsMessages: validatedData.acceptsMessages ?? true,
      user: {
        id: user.id, // ✅ ID real del usuario
        name: userName, // ✅ Nombre real del usuario
        avatar: userAvatar, // ✅ Avatar real del usuario
        rating: 5.0,
        reviewCount: 0
      },
      _count: {
        likesReceived: 0
      },
      createdAt: user.created_at ? new Date(user.created_at) : new Date() // ✅ Fecha real de registro
    }

    // Agregar al mock data compartido
    addProfile(newProfile)

    console.log(`✅ Perfil de comunidad creado para usuario: ${userName} (${user.id})`)

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
