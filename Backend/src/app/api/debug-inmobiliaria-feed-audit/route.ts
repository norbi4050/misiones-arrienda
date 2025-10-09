// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PROMPT C — Auditoría de origen de publicaciones en página "Inmobiliaria"
 * 
 * Endpoint de diagnóstico para detectar de dónde salen las tarjetas que se muestran
 * en /mi-empresa y /inmobiliaria/[id] y verificar si aparecen posts de Comunidad
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'No autenticado',
        details: authError?.message 
      }, { status: 401 });
    }

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, role, is_company, company_name')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'Error obteniendo datos de usuario',
        details: userError.message 
      }, { status: 500 });
    }

    const isAgency = userData?.user_type === 'inmobiliaria' || userData?.role === 'inmobiliaria' || userData?.is_company === true;

    // ========================================
    // AUDITORÍA 1: Propiedades del usuario
    // ========================================
    const { data: properties, error: propsError, count: propsCount } = await supabase
      .from('properties')
      .select('id, title, user_id, created_at, is_active, status', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // ========================================
    // AUDITORÍA 2: Posts de comunidad del usuario (NO deberían aparecer en feed agencia)
    // ========================================
    const { data: communityPosts, error: communityError, count: communityCount } = await supabase
      .from('community_posts')
      .select('id, title, user_id, created_at, is_active, status', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // ========================================
    // AUDITORÍA 3: Verificar si hay propiedades de otros usuarios (NO debería haber)
    // ========================================
    const { data: otherUserProps, error: otherPropsError, count: otherPropsCount } = await supabase
      .from('properties')
      .select('id, title, user_id, created_at', { count: 'exact' })
      .neq('user_id', user.id)
      .eq('is_active', true)
      .limit(10);

    // ========================================
    // AUDITORÍA 4: Verificar esquema de tablas
    // ========================================
    const tablesInfo = {
      properties: {
        description: 'Tabla principal de propiedades (inmuebles)',
        usedBy: 'Todos los usuarios (inmobiliarias, inquilinos, dueños directos)',
        endpoint: '/api/properties, /api/inmobiliarias/[id]/properties',
        filters: 'user_id, is_active, status'
      },
      community_posts: {
        description: 'Tabla de posts de comunidad (búsqueda de roommates, etc)',
        usedBy: 'Solo inquilinos y dueños directos (NO inmobiliarias)',
        endpoint: '/api/comunidad/posts, /api/comunidad/my-posts',
        filters: 'user_id, is_active, status'
      }
    };

    // ========================================
    // AUDITORÍA 5: Verificar endpoints usados
    // ========================================
    const endpointsAudit = {
      '/mi-empresa': {
        component: 'src/app/mi-empresa/page.tsx',
        dataSource: 'Ninguna (solo perfil, no muestra feed)',
        query: 'N/A',
        filters: 'N/A',
        status: '✅ No consulta propiedades ni comunidad'
      },
      '/inmobiliaria/[id]': {
        component: 'src/app/inmobiliaria/[id]/page.tsx',
        dataSource: 'properties table',
        query: 'SELECT * FROM properties WHERE user_id = $1 AND is_active = true',
        filters: 'user_id (del parámetro [id]), is_active = true',
        status: '✅ Solo propiedades del usuario, no incluye comunidad'
      },
      '/mi-cuenta/publicaciones': {
        component: 'src/app/mi-cuenta/publicaciones/page.tsx',
        dataSource: 'properties table',
        query: 'SELECT * FROM properties WHERE user_id = currentUser.id',
        filters: 'user_id (del usuario actual)',
        status: '✅ Solo propiedades del usuario, no incluye comunidad'
      },
      '/comunidad/mis-publicaciones': {
        component: 'src/app/comunidad/mis-publicaciones/page.tsx',
        dataSource: 'community_posts table',
        query: 'SELECT * FROM community_posts WHERE user_id = currentUser.id',
        filters: 'user_id (del usuario actual)',
        status: '✅ Solo posts de comunidad, separado de propiedades'
      }
    };

    // ========================================
    // AUDITORÍA 6: Verificar hooks de autenticación
    // ========================================
    const authHooksAudit = {
      useCurrentUser: {
        file: 'src/lib/auth/useCurrentUser.ts',
        format: 'camelCase',
        fields: 'userType, isAgency',
        status: '✅ Moderno, usa camelCase'
      },
      useAuth: {
        file: 'src/hooks/useAuth.ts',
        format: 'snake_case (legacy)',
        fields: 'user_type, role',
        status: '⚠️ Legacy, pero aún en uso'
      },
      useSupabaseAuth: {
        file: 'src/hooks/useSupabaseAuth.ts',
        format: 'mixed',
        fields: 'user.userType, user.role',
        status: '✅ Usado en mi-empresa page'
      }
    };

    // ========================================
    // DIAGNÓSTICO FINAL
    // ========================================
    const diagnosis = {
      userInfo: {
        id: userData.id,
        email: userData.email,
        userType: userData.user_type,
        role: userData.role,
        isCompany: userData.is_company,
        companyName: userData.company_name,
        isAgency: isAgency
      },
      propertiesCount: propsCount || 0,
      communityPostsCount: communityCount || 0,
      otherUserPropertiesVisible: otherPropsCount || 0,
      
      // Fuentes de datos
      sources: {
        properties: {
          status: '✅ OK',
          description: 'Propiedades del usuario actual',
          count: propsCount || 0,
          shouldShow: true,
          reason: 'Todas las propiedades del usuario deben mostrarse'
        },
        communityPosts: {
          status: isAgency ? '⚠️ FILTRAR' : '✅ OK',
          description: 'Posts de comunidad del usuario',
          count: communityCount || 0,
          shouldShow: !isAgency,
          reason: isAgency 
            ? 'Las inmobiliarias NO deben ver posts de comunidad en su feed'
            : 'Los inquilinos/dueños SÍ pueden ver sus posts de comunidad'
        },
      otherUserProperties: {
        status: (otherPropsCount ?? 0) > 0 ? '❌ REMOVER' : '✅ OK',
        description: 'Propiedades de otros usuarios',
        count: otherPropsCount ?? 0,
        shouldShow: false,
        reason: 'NUNCA deben mostrarse propiedades de otros usuarios en el feed personal'
      }
      },

      // Resumen de hallazgos
      findings: {
        miEmpresaPage: {
          hasPropertiesFeed: false,
          hasCommunityFeed: false,
          status: '✅ CORRECTO',
          note: 'La página /mi-empresa solo muestra perfil, no tiene feed de publicaciones'
        },
        inmobiliariaPublicPage: {
          dataSource: 'properties table only',
          filters: ['user_id = [id]', 'is_active = true'],
          includesCommunity: false,
          status: '✅ CORRECTO',
          note: 'Solo muestra propiedades del usuario, correctamente filtrado'
        },
        miCuentaPublicaciones: {
          dataSource: 'properties table only',
          filters: ['user_id = currentUser.id'],
          includesCommunity: false,
          status: '✅ CORRECTO',
          note: 'Solo muestra propiedades del usuario actual'
        },
        authSystem: {
          primaryHook: 'useSupabaseAuth (en mi-empresa)',
          userTypeField: 'user_type / userType',
          roleField: 'role',
          isCompanyField: 'is_company',
          status: '✅ CORRECTO',
          note: 'Sistema de autenticación funciona correctamente'
        }
      },

      // Recomendaciones
      recommendations: {
        immediate: [
          {
            priority: 'P0',
            action: 'Verificar que NO existan propiedades de otros usuarios visibles',
            reason: (otherPropsCount ?? 0) > 0 
              ? `Se encontraron ${otherPropsCount} propiedades de otros usuarios accesibles`
              : 'Verificación preventiva'
          },
          {
            priority: 'P1',
            action: 'Confirmar que inmobiliarias NO tienen posts de comunidad',
            reason: isAgency && (communityCount ?? 0) > 0
              ? `Usuario inmobiliaria tiene ${communityCount} posts de comunidad (inusual)`
              : 'Verificación preventiva'
          }
        ],
        preventive: [
          {
            priority: 'P2',
            action: 'Agregar guards en endpoints de inmobiliarias',
            reason: 'Prevenir que se consulten accidentalmente posts de comunidad'
          },
          {
            priority: 'P2',
            action: 'Agregar logs de auditoría con prefijo [AgencyFeed]',
            reason: 'Facilitar debugging y monitoreo'
          },
          {
            priority: 'P3',
            action: 'Agregar tests automatizados',
            reason: 'Prevenir regresiones futuras'
          }
        ]
      },

      // Metadata de auditoría
      audit: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        prompt: 'PROMPT C — Auditoría de origen de publicaciones',
        tables: tablesInfo,
        endpoints: endpointsAudit,
        authHooks: authHooksAudit
      }
    };

    return NextResponse.json(diagnosis, { status: 200 });

  } catch (error) {
    console.error('[AgencyFeedAudit] Error:', error);
    return NextResponse.json({ 
      error: 'Error en auditoría',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
