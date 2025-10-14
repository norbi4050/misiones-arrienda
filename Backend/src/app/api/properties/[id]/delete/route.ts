import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 })

    // 1) Verificar ownership
    const { data: prop, error: e1 } = await supabase
      .from("properties")
      .select("id, user_id")
      .eq("id", params.id)
      .single();
    if (e1 || !prop) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    if (prop.user_id !== user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    // 2) Listar objetos en storage
    const prefix = `${user.id}/${params.id}`;
    const { data: list, error: e2 } = await supabase.storage
      .from("property-images")
      .list(prefix, { limit: 1000, search: "" });
    if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 500 });

    // 3) Borrar en batch (si hay)
    if (list && list.length) {
      const paths = list.map(o => `${prefix}/${o.name}`);
      const { error: e3 } = await supabase.storage.from("property-images").remove(paths);
      if (e3) return NextResponse.json({ ok: false, error: e3.message }, { status: 500 });
    }

    // 4) Borrar la fila
    const { error: e4 } = await supabase.from("properties").delete().eq("id", params.id).eq("user_id", user.id);
    if (e4) return NextResponse.json({ ok: false, error: e4.message }, { status: 500 });

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "INTERNAL_ERROR" }, { status: 500 })
  }
}
