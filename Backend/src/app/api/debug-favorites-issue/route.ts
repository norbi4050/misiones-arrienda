// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 1. Check favorites table
    const { data: favoritesRaw, error: favError } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id);

    // 2. Check properties table for those property_ids
    const propertyIds = favoritesRaw?.map(f => f.property_id) || [];
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("id, title, status, user_id")
      .in("id", propertyIds);

    // 3. Try the current query (with inner join)
    const { data: currentQuery, error: currentError } = await supabase
      .from("favorites")
      .select(`
        property_id,
        properties!inner (
          id,
          title,
          status,
          user_id
        )
      `)
      .eq("user_id", user.id)
      .eq("properties.status", "PUBLISHED");

    // 4. Try without inner join
    const { data: withoutInner, error: withoutInnerError } = await supabase
      .from("favorites")
      .select(`
        property_id,
        properties (
          id,
          title,
          status,
          user_id
        )
      `)
      .eq("user_id", user.id);

    return NextResponse.json({
      user_id: user.id,
      diagnostics: {
        step1_favorites_raw: {
          count: favoritesRaw?.length || 0,
          data: favoritesRaw,
          error: favError
        },
        step2_properties_for_those_ids: {
          count: properties?.length || 0,
          data: properties,
          error: propError
        },
        step3_current_query_with_inner: {
          count: currentQuery?.length || 0,
          data: currentQuery,
          error: currentError
        },
        step4_without_inner_join: {
          count: withoutInner?.length || 0,
          data: withoutInner,
          error: withoutInnerError
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
