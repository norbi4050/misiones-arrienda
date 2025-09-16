import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

export async function GET(_req: NextRequest) {
  const supabase = await getServerSupabase();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // =====================================================
    // USAR FUNCIÓN SQL PARA OBTENER ESTADÍSTICAS REALES
    // =====================================================
    
    try {
      // Llamar a la función SQL que calcula estadísticas reales
      // Enviar parámetro directo para evitar ambigüedad de sobrecarga
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_stats', user.id);

      if (statsError) {
        console.error('Error calling get_user_profile_stats:', statsError);
        // Fallback a datos básicos si la función falla
        return await getFallbackStats(supabase, user);
      }

      // Parsear el JSON retornado por la función
      const stats = typeof statsData === 'string' ? JSON.parse(statsData) : statsData;
      
      return NextResponse.json({ 
        stats,
        source: 'real_data',
        timestamp: new Date().toISOString()
      }, { status: 200 });

    } catch (functionError) {
      console.error('Error with profile stats function:', functionError);
      // Fallback a consultas individuales
      return await getFallbackStats(supabase, user);
    }

  } catch (error) {
    console.error('Unexpected error in user stats:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// =====================================================
// FUNCIÓN FALLBACK CON CONSULTAS INDIVIDUALES REALES
// =====================================================
async function getFallbackStats(supabase: any, user: any) {
  try {
    console.log('Using fallback stats method for user:', user.id);

    // 1. Obtener vistas de perfil reales (últimos 30 días)
    // Usar nombre de columna consistente y timestamp sin Z
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timestampWithoutZ = thirtyDaysAgo.toISOString().replace('Z', '');
    
    const { count: profileViews, error: viewsError } = await supabase
      .from("profile_views")
      .select("*", { count: 'exact', head: true })
      .eq("profile_user_id", user.id)
      .gte("viewed_at", timestampWithoutZ);

    if (viewsError && viewsError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('Error fetching profile views:', viewsError);
    }

    // 2. Obtener conteo de mensajes reales (últimos 30 días)
    const { count: messageCount, error: messagesError } = await supabase
      .from("user_messages")
      .select("*", { count: 'exact', head: true })
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (messagesError && messagesError.code !== 'PGRST116') {
      console.error('Error fetching messages:', messagesError);
    }

    // 3. Obtener búsquedas activas reales
    const { count: searchesCount, error: searchesError } = await supabase
      .from("user_searches")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (searchesError && searchesError.code !== 'PGRST116') {
      console.error('Error fetching searches:', searchesError);
    }

    // 4. Obtener rating promedio y conteo de reviews reales
    // Usar .is() para filtro booleano más explícito
    const { data: ratingsData, error: ratingsError } = await supabase
      .from("user_ratings")
      .select("rating")
      .eq("rated_user_id", user.id)
      .is('is_public', true);

    let avgRating = 0;
    let reviewCount = 0;
    
    if (!ratingsError && ratingsData) {
      reviewCount = ratingsData.length;
      if (reviewCount > 0) {
        avgRating = ratingsData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount;
      }
    } else if (ratingsError && ratingsError.code !== 'PGRST116') {
      console.error('Error fetching ratings:', ratingsError);
    }

    // 5. Obtener conteo de favoritos reales
    const { count: favoriteCount, error: favoritesError } = await supabase
      .from("favorites")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id);

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
    }

    // 6. Calcular tasa de respuesta basada en actividad real
    const { count: activityCount, error: activityError } = await supabase
      .from("user_activity_log")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    let responseRate = 0;
    if (!activityError && activityCount !== null) {
      // Calcular tasa de respuesta basada en actividad
      responseRate = Math.min(95, 70 + Math.floor((activityCount || 0) * 2));
    } else {
      // Fallback basado en mensajes
      responseRate = (messageCount || 0) > 0 ? Math.min(95, 70 + (messageCount || 0) * 3) : 0;
    }

    // 7. Determinar nivel de verificación
    let verificationLevel: 'none' | 'email' | 'phone' | 'full' = 'none';
    if (user.email_confirmed_at && user.phone_confirmed_at) {
      verificationLevel = 'full';
    } else if (user.phone_confirmed_at) {
      verificationLevel = 'phone';
    } else if (user.email_confirmed_at) {
      verificationLevel = 'email';
    }

    const stats = {
      profileViews: profileViews || 0,
      favoriteCount: favoriteCount || 0,
      messageCount: messageCount || 0,
      rating: Number(avgRating.toFixed(2)),
      reviewCount: reviewCount,
      searchesCount: searchesCount || 0,
      responseRate,
      joinDate: user.created_at,
      verificationLevel,
      activityCount: activityCount || 0
    };

    return NextResponse.json({ 
      stats,
      source: 'fallback_queries',
      timestamp: new Date().toISOString(),
      note: 'Using individual queries as fallback'
    }, { status: 200 });

  } catch (fallbackError) {
    console.error('Error in fallback stats:', fallbackError);
    
    // Último recurso: datos mínimos pero reales
    const { count: favoriteCount } = await supabase
      .from("favorites")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id);

    const minimalStats = {
      profileViews: 0,
      favoriteCount: favoriteCount || 0,
      messageCount: 0,
      rating: 0,
      reviewCount: 0,
      searchesCount: 0,
      responseRate: 0,
      joinDate: user.created_at,
      verificationLevel: user.email_confirmed_at ? 'email' : 'none',
      activityCount: 0
    };

    return NextResponse.json({ 
      stats: minimalStats,
      source: 'minimal_fallback',
      timestamp: new Date().toISOString(),
      warning: 'Using minimal stats due to errors'
    }, { status: 200 });
  }
}
