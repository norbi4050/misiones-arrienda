import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DEBUG ENDPOINT: Diagnosticar mezcla de propiedades y posts de comunidad
 * 
 * GET /api/debug-inmobiliaria-properties?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Verificar el usuario
    const userResult = await supabase
      .from('users')
      .select('id, email, role, company_name, user_type')
      .eq('id', userId)
      .single();

    if (userResult.error) {
      return NextResponse.json({
        error: 'Error al obtener usuario',
        details: userResult.error.message,
      }, { status: 500 });
    }

    // 2. Obtener TODAS las propiedades del usuario (activas e inactivas)
    const propsResult = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Obtener TODOS los posts de comunidad del usuario
    const postsResult = await supabase
      .from('community_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const allProperties = propsResult.data || [];
    const communityPosts = postsResult.data || [];

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      userId,
      user: {
        id: userResult.data?.id,
        email: userResult.data?.email,
        role: userResult.data?.role,
        company_name: userResult.data?.company_name,
        user_type: userResult.data?.user_type,
      },
      properties: {
        total: allProperties.length,
        active: allProperties.filter(p => p.is_active).length,
        inactive: allProperties.filter(p => !p.is_active).length,
        list: allProperties.map(p => ({
          id: p.id,
          title: p.title,
          property_type: p.property_type,
          is_active: p.is_active,
          created_at: p.created_at,
          operation_type: p.operation_type,
        })),
      },
      communityPosts: {
        total: communityPosts.length,
        list: communityPosts.map(p => ({
          id: p.id,
          title: p.title,
          post_type: p.post_type,
          is_active: p.is_active,
          created_at: p.created_at,
        })),
      },
      errors: {
        propsError: propsResult.error?.message || null,
        postsError: postsResult.error?.message || null,
      },
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
