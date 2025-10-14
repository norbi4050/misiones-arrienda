import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforcePlanLimit } from '@/lib/plan-guards';

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // ⭐ B4: Verificar límite de plan antes de activar/publicar propiedad
    const planCheck = await enforcePlanLimit(user.id, 'activate_property');
    if (!planCheck.success) {
      return NextResponse.json(
        { error: planCheck.error },
        { status: 403 }
      );
    }

    // 1) Obtener propiedad (ownership)
    const { data: prop, error: e1 } = await supabase
      .from("properties")
      .select("id, user_id, updated_at, images_urls")
      .eq("id", params.id)
      .single();
    if (e1 || !prop) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (prop.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // 2) Verificar imágenes en bucket - usar prop.user_id (dueño real)
    const prefix = `${prop.user_id}/${params.id}`;
    const { data: list, error: e2 } = await supabase.storage
      .from("property-images")
      .list(prefix, { limit: 1 }); // basta con verificar 1
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

    // 3) Fallback a images_urls
    const urls = Array.isArray(prop.images_urls) ? prop.images_urls : [];

    if ((!list || list.length === 0) && urls.length === 0) {
      return NextResponse.json({ 
        error: "Necesitás al menos 1 imagen para publicar" 
      }, { status: 400 });
    }

    // 4) Publicar - setear todos los campos necesarios para visibilidad
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

    const { error: e3 } = await supabase
      .from("properties")
      .update({ 
        status: "PUBLISHED",
        is_active: true,
        published_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .eq("user_id", user.id);
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "INTERNAL_ERROR" }, { status: 500 });
  }
}
