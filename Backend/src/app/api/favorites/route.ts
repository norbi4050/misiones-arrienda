import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("property_id")
      .eq("user_id", user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      propertyIds: (data ?? []).map(d => d.property_id) 
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { propertyId } = await req.json();
    
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Try to insert the favorite
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, property_id: propertyId })
      .select("id")  // Force error if RLS fails
      .single();

    // Handle duplicate key error (already favorited)
    if (error && /duplicate key value/.test(error.message)) {
      // Already exists, so this is fine - return success
      return NextResponse.json({ ok: true });
    }

    if (error) {
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
