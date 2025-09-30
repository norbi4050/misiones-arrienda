import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function DELETE(_: Request, { params }: { params: { propertyId: string } }) {
  try {
    const { propertyId } = params;
    
    // Validar que propertyId esté presente
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(propertyId)) {
      return NextResponse.json({ error: "propertyId must be a valid UUID" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Verificar que el favorito existe antes de eliminarlo
    const { data: existingFavorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .single();

    if (!existingFavorite) {
      // No existe el favorito, pero esto es idempotente - devolver éxito
      return NextResponse.json({ ok: true, message: "Property was not in favorites" });
    }

    // Eliminar el favorito
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Property removed from favorites" });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/favorites/[propertyId]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
