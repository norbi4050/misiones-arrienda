// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // 1. Verificar si existe la vista community_posts_public
    const { data: viewExists, error: viewError } = await supabase
      .from('community_posts_public')
      .select('*')
      .limit(1)

    // 2. Consultar directamente la tabla community_posts
    const { data: directPosts, error: directError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 3. Consultar la vista (si existe)
    const { data: viewPosts, error: viewPostsError } = await supabase
      .from('community_posts_public')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // 4. Verificar posts activos
    const { data: activePosts, error: activeError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      viewExists: !viewError,
      viewError: viewError?.message,
      directPosts: {
        count: directPosts?.length || 0,
        data: directPosts,
        error: directError?.message
      },
      viewPosts: {
        count: viewPosts?.length || 0,
        data: viewPosts,
        error: viewPostsError?.message
      },
      activePosts: {
        count: activePosts?.length || 0,
        data: activePosts,
        error: activeError?.message
      }
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Error interno', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
