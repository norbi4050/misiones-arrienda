import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/comunidad/posts/[id]/unpublish - Despublicar post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const postId = params.id

    // Verificar que el post existe y pertenece al usuario
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, user_id, status')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post no encontrado o no tienes permisos' },
        { status: 404 }
      )
    }

    if (post.status === 'inactive') {
      return NextResponse.json(
        { error: 'El post ya está despublicado' },
        { status: 400 }
      )
    }

    // Llamar RPC para despublicar
    const { data, error: rpcError } = await supabase
      .rpc('community_post_unpublish', { post_id: postId })

    if (rpcError) {
      console.error('Error calling community_post_unpublish RPC:', rpcError)
      
      // Fallback: actualizar directamente si RPC no existe
      const { error: updateError } = await supabase
        .from('community_posts')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error unpublishing post:', updateError)
        return NextResponse.json(
          { error: 'Error al despublicar post' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Post despublicado correctamente'
    })

  } catch (error) {
    console.error('Error in post unpublish:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
