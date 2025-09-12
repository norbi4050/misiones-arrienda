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

    // Try to use the SQL function first
    const { data: statsResult, error: statsError } = await supabase
      .rpc('get_user_stats', { target_user_id: user.id });

    if (!statsError && statsResult) {
      return NextResponse.json({ stats: statsResult }, { status: 200 });
    }

    // Fallback to manual queries if function fails
    console.log('SQL function failed, using manual queries:', statsError);
    
    const [
      { count: profileViews },
      { count: favoritesCount },
      { count: messagesCount },
      { count: searchesCount },
      { data: userProfile }
    ] = await Promise.all([
      supabase
        .from("profile_views")
        .select("*", { count: 'exact', head: true })
        .eq("viewed_user_id", user.id),
      supabase
        .from("favorites")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_messages")
        .select("*", { count: 'exact', head: true })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase
        .from("user_searches")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id),
      supabase
        .from("User")
        .select("rating, reviewCount, created_at")
        .eq("id", user.id)
        .single()
    ]);

    // Determine verification level
    let verificationLevel: 'none' | 'email' | 'phone' | 'full' = 'none';
    if (user.email_confirmed_at) {
      verificationLevel = 'email';
    }
    if (user.phone && user.phone_confirmed_at) {
      verificationLevel = 'phone';
    }
    if (user.email_confirmed_at && user.phone_confirmed_at) {
      verificationLevel = 'full';
    }

    const stats = {
      profileViews: profileViews || 0,
      favoriteCount: favoritesCount || 0,
      messageCount: messagesCount || 0,
      rating: userProfile?.rating || 0,
      reviewCount: userProfile?.reviewCount || 0,
      searchesCount: searchesCount || 0,
      responseRate: 85, // Default response rate
      joinDate: userProfile?.created_at || user.created_at,
      verificationLevel
    };

    return NextResponse.json({ stats }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in user stats:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
