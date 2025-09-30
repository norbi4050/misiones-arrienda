import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CommunityPost, CommunityPostsResponse } from '@/types/community'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const statusFilter = searchParams.get('status') || 'all'

    // Construir query
    let query = supabase
      .from('community_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Filtro de status
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter.toUpperCase())
    }

    // Ordenar y paginar
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching my community posts:', error)
      return NextResponse.json(
        { error: 'Error al obtener tus publicaciones' },
        { status: 500 }
      )
    }

    const posts: CommunityPost[] = data || []
    const total = count || 0
    const hasMore = offset + limit < total

    const response: CommunityPostsResponse = {
      posts,
      total,
      page,
      limit,
      hasMore
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/comunidad/my-posts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
