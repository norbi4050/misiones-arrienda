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

// POST /api/comunidad/posts/[id]/publish - Publicar post
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

    if (post.status === 'active') {
      return NextResponse.json(
        { error: 'El post ya está publicado' },
        { status: 400 }
      )
    }

    // Establecer fecha de expiración (30 días)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Llamar RPC para publicar
    const { data, error: rpcError } = await supabase
      .rpc('community_post_publish', { post_id: postId })

    if (rpcError) {
      console.error('Error calling community_post_publish RPC:', rpcError)
      
      // Fallback: actualizar directamente si RPC no existe
      const { error: updateError } = await supabase
        .from('community_posts')
        .update({ 
          status: 'active',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error publishing post:', updateError)
        return NextResponse.json(
          { error: 'Error al publicar post' },
          { status: 500 }
        )
      }
    } else {
      // Si RPC funcionó, actualizar expires_at por separado
      await supabase
        .from('community_posts')
        .update({ expires_at: expiresAt.toISOString() })
        .eq('id', postId)
    }

    return NextResponse.json({
      success: true,
      message: 'Post publicado correctamente'
    })

  } catch (error) {
    console.error('Error in post publish:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
