import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function DELETE(_: Request, { params }: { params: { propertyId: string } }) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", params.propertyId);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/favorites/[propertyId]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
