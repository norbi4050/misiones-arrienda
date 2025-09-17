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

// POST: Register a profile view
export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const { profileUserId } = await req.json();

    if (!profileUserId) {
      return NextResponse.json({ error: "Profile user ID required" }, { status: 400 });
    }

    // Get client IP and user agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const referrer = req.headers.get('referer') || null;

    // Don't track self-views
    if (user && user.id === profileUserId) {
      return NextResponse.json({ message: "Self-view not tracked" }, { status: 200 });
    }

    // Check if this IP has viewed this profile recently (prevent spam)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentView, error: checkError } = await supabase
      .from("profile_views")
      .select("id")
      .eq("profile_user_id", profileUserId)
      .eq("ip_address", ip)
      .gte("viewed_at", oneHourAgo)
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking recent views:', checkError);
      // Continue anyway - this is just spam prevention
    }

    // If there's a recent view from this IP, don't record another one
    if (recentView && recentView.length > 0) {
      return NextResponse.json({ message: "Recent view already recorded" }, { status: 200 });
    }

    // Record the profile view
    const { data: newView, error: insertError } = await supabase
      .from("profile_views")
      .insert({
        profile_user_id: profileUserId,
        viewer_user_id: user?.id || null,
        ip_address: ip,
        user_agent: userAgent,
        referrer: referrer
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error recording profile view:', insertError);
      // If the table doesn't exist yet, return success anyway
      if (insertError.code === '42P01') {
        return NextResponse.json({
          message: "Profile view tracking not yet available",
          tracked: false
        }, { status: 200 });
      }
      return NextResponse.json({ error: "Error recording view" }, { status: 500 });
    }

    // Log the activity if user is authenticated
    if (user) {
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'profile_view',
        p_activity_data: { viewed_profile: profileUserId },
        p_ip_address: ip,
        p_user_agent: userAgent
      });
    }

    return NextResponse.json({
      message: "Profile view recorded",
      viewId: newView.id,
      tracked: true
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in profile view tracking:', error);
    return NextResponse.json({
      error: "Internal server error",
      tracked: false
    }, { status: 500 });
  }
}

// GET: Get profile views for a user (for analytics)
export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '30'; // days
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const daysAgo = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000).toISOString();

    // Get profile views for the authenticated user
    const { data: views, error: viewsError } = await supabase
      .from("profile_views")
      .select(`
        id,
        viewed_at,
        ip_address,
        referrer,
        viewer:viewer_user_id (
          id,
          name,
          email
        )
      `)
      .eq("profile_user_id", user.id)
      .gte("viewed_at", daysAgo)
      .order("viewed_at", { ascending: false })
      .limit(limit);

    if (viewsError) {
      console.error('Error fetching profile views:', viewsError);
      if (viewsError.code === '42P01') {
        return NextResponse.json({
          views: [],
          total: 0,
          message: "Profile view tracking not yet available"
        }, { status: 200 });
      }
      return NextResponse.json({ error: "Error fetching views" }, { status: 500 });
    }

    // Get total count
    const { count: totalViews, error: countError } = await supabase
      .from("profile_views")
      .select("*", { count: 'exact', head: true })
      .eq("profile_user_id", user.id)
      .gte("viewed_at", daysAgo);

    if (countError) {
      console.error('Error counting profile views:', countError);
    }

    return NextResponse.json({
      views: views || [],
      total: totalViews || 0,
      timeframe: parseInt(timeframe)
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error fetching profile views:', error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}
