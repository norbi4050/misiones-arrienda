// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/debug-inmobiliaria-mezcla-actual
 * 
 * Endpoint de diagnóstico para investigar la mezcla de propiedades y posts de comunidad
 * en el perfil de inmobiliaria
 * 
 * Query params:
 * - inmobiliariaId: ID del usuario inmobiliaria a investigar (opcional, usa el usuario actual si no se provee)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inmobiliariaId = searchParams.get('inmobiliariaId');

    const supabase = createClient();

    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Usar el ID proporcionado o el del usuario actual
    const targetUserId = inmobiliariaId || user.id;

    // 1. Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'Error al obtener usuario', details: userError },
        { status: 500 }
      );
    }

    // 2. Obtener TODAS las propiedades del usuario (de la tabla properties)
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (propsError) {
      return NextResponse.json(
        { error: 'Error al obtener propiedades', details: propsError },
        { status: 500 }
      );
    }

    // 3. Obtener TODOS los posts de comunidad del usuario (de la tabla community_posts)
    const { data: communityPosts, error: communityError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    // Ignorar error si la tabla no existe
    const communityPostsData = communityError ? [] : (communityPosts || []);

    // 4. Verificar si hay propiedades que parecen posts de comunidad
    const suspiciousProperties = properties?.filter(prop => {
      const title = prop.title?.toLowerCase() || '';
      return (
        title.includes('busco') ||
        title.includes('compañero') ||
        title.includes('roommate') ||
        title.includes('compartir') ||
        title.includes('inquilino')
      );
    }) || [];

    // 5. Construir respuesta detallada
    const response = {
      timestamp: new Date().toISOString(),
      investigacion: {
        usuario_investigado: {
          id: userData.id,
          email: userData.email,
          user_type: userData.user_type,
          role: userData.role,
          is_company: userData.is_company,
          company_name: userData.company_name,
          created_at: userData.created_at,
        },
        es_inmobiliaria: userData.user_type === 'inmobiliaria' || userData.role === 'inmobiliaria' || userData.is_company === true,
      },
      estadisticas: {
        total_properties: properties?.length || 0,
        properties_activas: properties?.filter(p => p.is_active).length || 0,
        properties_publicadas: properties?.filter(p => p.status === 'published').length || 0,
        total_community_posts: communityPostsData.length,
        community_posts_activos: communityPostsData.filter((p: any) => p.is_active).length || 0,
        propiedades_sospechosas: suspiciousProperties.length,
      },
      propiedades_en_tabla_properties: properties?.map(prop => ({
        id: prop.id,
        title: prop.title,
        property_type: prop.property_type,
        operation_type: prop.operation_type,
        is_active: prop.is_active,
        status: prop.status,
        created_at: prop.created_at,
        es_sospechosa: suspiciousProperties.some(sp => sp.id === prop.id),
        razon_sospecha: suspiciousProperties.some(sp => sp.id === prop.id)
          ? 'Título contiene palabras típicas de búsqueda de compañeros'
          : null,
      })) || [],
      posts_en_tabla_community: communityPostsData.map((post: any) => ({
        id: post.id,
        title: post.title,
        is_active: post.is_active,
        created_at: post.created_at,
      })),
      propiedades_sospechosas_detalle: suspiciousProperties.map(prop => ({
        id: prop.id,
        title: prop.title,
        created_at: prop.created_at,
        palabras_encontradas: [
          prop.title?.toLowerCase().includes('busco') && 'busco',
          prop.title?.toLowerCase().includes('compañero') && 'compañero',
          prop.title?.toLowerCase().includes('roommate') && 'roommate',
          prop.title?.toLowerCase().includes('compartir') && 'compartir',
          prop.title?.toLowerCase().includes('inquilino') && 'inquilino',
        ].filter(Boolean),
      })),
      diagnostico: {
        problema_detectado: false,
        descripcion: '',
        recomendaciones: [] as string[],
      },
    };

    // Análisis y diagnóstico
    if (response.investigacion.es_inmobiliaria && communityPostsData.length > 0) {
      response.diagnostico.problema_detectado = true;
      response.diagnostico.descripcion = 'Una inmobiliaria tiene posts en la tabla community_posts, lo cual NO debería ocurrir';
      response.diagnostico.recomendaciones.push(
        'Eliminar los posts de community_posts de esta inmobiliaria',
        'Agregar validación en el backend para prevenir que inmobiliarias creen posts de comunidad'
      );
    }

    if (!response.investigacion.es_inmobiliaria && properties && properties.length > 0) {
      response.diagnostico.descripcion = 'Un usuario NO inmobiliaria tiene propiedades en la tabla properties. Esto es NORMAL y permitido.';
      response.diagnostico.recomendaciones.push(
        'Verificar que la UI muestre correctamente la separación entre propiedades y posts de comunidad',
        'Asegurar que el usuario entienda la diferencia entre ambos tipos de contenido'
      );
    }

    if (suspiciousProperties.length > 0) {
      response.diagnostico.problema_detectado = true;
      response.diagnostico.descripcion += ' Se encontraron propiedades con títulos que parecen búsquedas de compañeros.';
      response.diagnostico.recomendaciones.push(
        'Revisar si estas propiedades deberían estar en community_posts en lugar de properties',
        'Considerar migrar estas propiedades a la tabla correcta'
      );
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in debug-inmobiliaria-mezcla-actual:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
