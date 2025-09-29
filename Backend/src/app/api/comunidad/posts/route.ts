import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCommunityPostSchema, communityPostFiltersSchema } from '@/lib/validations/community'
import type { CommunityPost, CommunityPostsResponse } from '@/types/community'

// GET /api/comunidad/posts - Lista paginada desde view public.community_posts_public
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parsear y validar parámetros
    const rawParams = {
      city: searchParams.get('city') || undefined,
      role: searchParams.get('role') || undefined,
      q: searchParams.get('q') || undefined,
      min: searchParams.get('min') ? Number(searchParams.get('min')) : undefined,
      max: searchParams.get('max') ? Number(searchParams.get('max')) : undefined,
      roomType: searchParams.get('roomType') || undefined,
      petPref: searchParams.get('petPref') || undefined,
      smokePref: searchParams.get('smokePref') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      sort: searchParams.get('sort') || 'recent'
    }

    const filters = communityPostFiltersSchema.parse(rawParams)
    const supabase = createClient()

    // Construir query base desde la view (ya filtra is_active y expires_at)
    let query = supabase
      .from('community_posts_public')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }

    if (filters.role) {
      query = query.eq('role', filters.role)
    }

    if (filters.q) {
      query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`)
    }

    // Filtros de precio condicionales por rol
    if (filters.min !== undefined) {
      // Para OFREZCO: aplicar a price, para BUSCO: aplicar a budget_min
      query = query.or(`and(role.eq.OFREZCO,price.gte.${filters.min}),and(role.eq.BUSCO,budget_min.gte.${filters.min})`)
    }

    if (filters.max !== undefined) {
      // Para OFREZCO: aplicar a price, para BUSCO: aplicar a budget_max
      query = query.or(`and(role.eq.OFREZCO,price.lte.${filters.max}),and(role.eq.BUSCO,budget_max.lte.${filters.max})`)
    }

    if (filters.roomType) {
      query = query.eq('room_type', filters.roomType)
    }

    if (filters.petPref) {
      query = query.eq('pet_pref', filters.petPref)
    }

    if (filters.smokePref) {
      query = query.eq('smoke_pref', filters.smokePref)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    // Ordenamiento
    if (filters.sort === 'highlight') {
      query = query.order('highlighted_until', { ascending: false, nullsFirst: false })
                   .order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Paginación
    const offset = (filters.page - 1) * filters.limit
    query = query.range(offset, offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching community posts:', error)
      return NextResponse.json(
        { error: 'Error al obtener los posts de comunidad' },
        { status: 500 }
      )
    }

    const posts: CommunityPost[] = data || []
    const total = count || 0
    const hasMore = offset + filters.limit < total

    const response: CommunityPostsResponse = {
      posts,
      total,
      page: filters.page,
      limit: filters.limit,
      hasMore
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/comunidad/posts:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda inválidos', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/comunidad/posts - Crea post con user_id = auth.uid()
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createCommunityPostSchema.parse(body)

    // Mapear camelCase → snake_case para Supabase
    const postData = {
      user_id: user.id,
      role: validatedData.role,
      title: validatedData.title,
      description: validatedData.description,
      city: validatedData.city,
      neighborhood: validatedData.neighborhood,
      price: validatedData.price,
      budget_min: validatedData.budgetMin,
      budget_max: validatedData.budgetMax,
      available_from: validatedData.availableFrom,
      lease_term: validatedData.leaseTerm,
      room_type: validatedData.roomType,
      occupants: validatedData.occupants,
      pet_pref: validatedData.petPref,
      smoke_pref: validatedData.smokePref,
      diet: validatedData.diet,
      amenities: validatedData.amenities,
      tags: validatedData.tags,
      images: validatedData.images,
      is_active: true
      // No incluir created_at/updated_at - manejados por triggers
    }

    // Insert directo (no upsert)
    const { data, error } = await supabase
      .from('community_posts')
      .insert(postData)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating community post:', error)
      return NextResponse.json(
        { error: 'Error al crear el post de comunidad' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { id: data.id, message: 'Post creado exitosamente' },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error in POST /api/comunidad/posts:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
