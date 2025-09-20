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
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // Get user's favorites with property details
    const { data: favorites, error: favoritesError } = await supabase
      .from("favorites")
      .select(`
        id,
        created_at,
        property:properties (
          id,
          title,
          description,
          price,
          location,
          images,
          bedrooms,
          bathrooms,
          area,
          status,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json({ items: favorites || [] }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in favorites:', error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { propertyId } = await req.json();

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 });
    }

    // Check if favorite already exists
    const { data: existingFavorite, error: checkError } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking favorite:', checkError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existingFavorite.id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return NextResponse.json({ error: "Error removing favorite" }, { status: 500 });
      }

      return NextResponse.json({
        message: "Favorite removed",
        isFavorite: false
      }, { status: 200 });
    } else {
      // Add favorite
      const { data: newFavorite, error: insertError } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          property_id: propertyId
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding favorite:', insertError);
        return NextResponse.json({ error: "Error adding favorite" }, { status: 500 });
      }

      return NextResponse.json({
        message: "Favorite added",
        favorite: newFavorite,
        isFavorite: true
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Unexpected error in favorites POST:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const propertyId = req.nextUrl.searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);

    if (deleteError) {
      console.error('Error deleting favorite:', deleteError);
      return NextResponse.json({ error: "Error deleting favorite" }, { status: 500 });
    }

    return NextResponse.json({ message: "Favorite deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in favorites DELETE:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
