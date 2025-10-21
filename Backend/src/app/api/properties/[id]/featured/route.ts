import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforcePlanLimit } from '@/lib/plan-guards';

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Parse request body
    const body = await req.json();
    const { featured } = body;

    // Validate featured is a boolean
    if (typeof featured !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: "El campo 'featured' debe ser un valor booleano"
      }, { status: 400 });
    }

    // Solo verificar límite de plan si se está intentando destacar (no al quitar)
    if (featured) {
      const planCheck = await enforcePlanLimit(user.id, 'mark_property_featured');
      if (!planCheck.success) {
        return NextResponse.json(
          {
            success: false,
            error: planCheck.error.message
          },
          { status: 403 }
        );
      }
    }

    // 1) Verificar que la propiedad existe y pertenece al usuario
    const { data: prop, error: e1 } = await supabase
      .from("properties")
      .select("id, user_id, featured")
      .eq("id", params.id)
      .single();

    if (e1 || !prop) {
      return NextResponse.json({
        success: false,
        error: "Propiedad no encontrada"
      }, { status: 404 });
    }

    if (prop.user_id !== user.id) {
      return NextResponse.json({
        success: false,
        error: "No tienes permiso para modificar esta propiedad"
      }, { status: 403 });
    }

    // 2) Actualizar el estado de destacado
    const { error: e2 } = await supabase
      .from("properties")
      .update({
        featured,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (e2) {
      return NextResponse.json({
        success: false,
        error: e2.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      featured
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e?.message ?? "INTERNAL_ERROR"
    }, { status: 500 });
  }
}
