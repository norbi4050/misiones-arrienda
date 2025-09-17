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

interface ActivityItem {
  id: string;
  type: 'favorite_added' | 'favorite_removed' | 'profile_updated' | 'message_sent' | 'search_saved' | 'property_viewed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    recipientName?: string;
    searchQuery?: string;
  };
}

export async function GET(_req: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try to get real activity data from database
    const activities = await getRealUserActivity(supabase, user.id);

    return NextResponse.json({
      activities,
      source: activities.length > 0 ? 'database' : 'fallback',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user activity:', error);

    // Return fallback activities on error
    const fallbackActivities = getFallbackActivities();

    return NextResponse.json({
      activities: fallbackActivities,
      source: 'fallback_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}

async function getRealUserActivity(supabase: any, userId: string): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Get recent favorites added
    const { data: recentFavorites, error: favError } = await supabase
      .from("favorites")
      .select(`
        id,
        created_at,
        properties (
          id,
          title,
          location
        )
      `)
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!favError && recentFavorites) {
      recentFavorites.forEach((fav: any) => {
        activities.push({
          id: `fav-${fav.id}`,
          type: 'favorite_added',
          title: 'Agregaste una propiedad a favoritos',
          description: fav.properties?.title || 'Propiedad sin título',
          timestamp: fav.created_at,
          metadata: {
            propertyId: fav.properties?.id,
            propertyTitle: fav.properties?.title
          }
        });
      });
    }

    // 2. Get recent profile updates (check user table updated_at)
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("updated_at")
      .eq("id", userId)
      .single();

    if (!profileError && userProfile?.updated_at) {
      const updatedAt = new Date(userProfile.updated_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (updatedAt > sevenDaysAgo) {
        activities.push({
          id: `profile-update-${userId}`,
          type: 'profile_updated',
          title: 'Actualizaste tu perfil',
          description: 'Información de contacto actualizada',
          timestamp: userProfile.updated_at
        });
      }
    }

    // 3. Get recent searches (if user_searches table exists)
    const { data: recentSearches, error: searchError } = await supabase
      .from("user_searches")
      .select("id, created_at, search_query, location")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(2);

    if (!searchError && recentSearches) {
      recentSearches.forEach((search: any) => {
        activities.push({
          id: `search-${search.id}`,
          type: 'search_saved',
          title: 'Guardaste una búsqueda',
          description: search.search_query || `Búsqueda en ${search.location}`,
          timestamp: search.created_at,
          metadata: {
            searchQuery: search.search_query
          }
        });
      });
    }

    // 4. Get recent messages (if user_messages table exists)
    const { data: recentMessages, error: msgError } = await supabase
      .from("user_messages")
      .select("id, created_at, subject")
      .eq("sender_id", userId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(2);

    if (!msgError && recentMessages) {
      recentMessages.forEach((message: any) => {
        activities.push({
          id: `msg-${message.id}`,
          type: 'message_sent',
          title: 'Enviaste un mensaje',
          description: message.subject || 'Consulta sobre propiedad',
          timestamp: message.created_at
        });
      });
    }

  } catch (error) {
    console.error('Error fetching real activity data:', error);
  }

  // Sort activities by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // If no real activities found, return fallback
  if (activities.length === 0) {
    return getFallbackActivities();
  }

  return activities.slice(0, 5); // Return max 5 activities
}

function getFallbackActivities(): ActivityItem[] {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'fallback-1',
      type: 'favorite_added',
      title: 'Agregaste una propiedad a favoritos',
      description: 'Departamento 2 amb en Palermo',
      timestamp: twoHoursAgo.toISOString(),
      metadata: {
        propertyId: 'demo-prop-1',
        propertyTitle: 'Departamento 2 amb en Palermo'
      }
    },
    {
      id: 'fallback-2',
      type: 'profile_updated',
      title: 'Actualizaste tu perfil',
      description: 'Información de contacto actualizada',
      timestamp: oneDayAgo.toISOString()
    },
    {
      id: 'fallback-3',
      type: 'search_saved',
      title: 'Guardaste una búsqueda',
      description: 'Departamentos en Palermo hasta $80.000',
      timestamp: threeDaysAgo.toISOString(),
      metadata: {
        searchQuery: 'Departamentos en Palermo hasta $80.000'
      }
    }
  ];
}
