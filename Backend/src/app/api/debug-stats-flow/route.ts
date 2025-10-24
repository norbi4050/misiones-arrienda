import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * DEBUG: Flujo completo de estadísticas
 * 
 * Verifica todo el flujo desde la configuración hasta el renderizado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'No autenticado',
        step: 'auth'
      }, { status: 401 });
    }

    console.log('🔍 [DEBUG Stats] Usuario:', user.id);

    // 1. Verificar perfil en users
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({
        error: 'Error obteniendo perfil',
        step: 'user_profile',
        details: userError
      }, { status: 500 });
    }

    console.log('✅ [DEBUG Stats] Perfil encontrado:', {
      id: userProfile.id,
      company_name: userProfile.company_name,
      user_type: userProfile.user_type,
      show_stats_public: userProfile.show_stats_public
    });

    // 2. Obtener estadísticas
    const statsUrl = `${getSiteUrl()}/api/inmobiliarias/${user.id}/stats`;
    console.log('📊 [DEBUG Stats] Llamando a:', statsUrl);

    const statsResponse = await fetch(statsUrl, {
      next: { revalidate: 0 }
    });

    let statsData = null;
    let statsError = null;

    if (statsResponse.ok) {
      statsData = await statsResponse.json();
      console.log('✅ [DEBUG Stats] Stats obtenidas:', statsData);
    } else {
      const errorText = await statsResponse.text();
      statsError = {
        status: statsResponse.status,
        statusText: statsResponse.statusText,
        body: errorText
      };
      console.error('❌ [DEBUG Stats] Error en stats:', statsError);
    }

    // 3. Simular renderizado del componente
    const shouldShowStats = userProfile.show_stats_public && statsData && statsData.stats;
    
    console.log('🎨 [DEBUG Stats] Condición de renderizado:', {
      show_stats_public: userProfile.show_stats_public,
      hasStatsData: !!statsData,
      hasStatsObject: !!(statsData && statsData.stats),
      shouldShowStats
    });

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email,
          user_type: userProfile.user_type
        },
        profile: {
          company_name: userProfile.company_name,
          show_stats_public: userProfile.show_stats_public,
          show_map_public: userProfile.show_map_public,
          show_team_public: userProfile.show_team_public,
          show_hours_public: userProfile.show_hours_public,
          latitude: userProfile.latitude,
          longitude: userProfile.longitude
        },
        stats: {
          apiUrl: statsUrl,
          response: statsData,
          error: statsError
        },
        rendering: {
          show_stats_public: userProfile.show_stats_public,
          hasStatsData: !!statsData,
          hasStatsObject: !!(statsData && statsData.stats),
          shouldShowStats,
          reason: !shouldShowStats 
            ? (!userProfile.show_stats_public 
                ? 'show_stats_public es false' 
                : !statsData 
                  ? 'statsData es null' 
                  : 'statsData.stats es null')
            : 'Debería mostrarse correctamente'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [DEBUG Stats] Error inesperado:', error);
    return NextResponse.json({
      error: 'Error inesperado',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
