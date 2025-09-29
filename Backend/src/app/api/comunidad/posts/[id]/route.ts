import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CommunityPost } from '@/types/community'

// GET /api/comunidad/posts/[id] - Devuelve detalle + author_photo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del post es requerido' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Obtener post desde la view con datos del autor
    const { data, error } = await supabase
      .from('community_posts_public')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single()

    if (error) {
      console.error('Error fetching community post:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post no encontrado' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error al obtener el post' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Post no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const post: CommunityPost = data

    return NextResponse.json(post)

  } catch (error) {
    console.error('Error in GET /api/comunidad/posts/[id]:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
