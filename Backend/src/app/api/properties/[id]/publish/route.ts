import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforcePlanLimit } from '@/lib/plan-guards';
import { sendNotification } from '@/lib/notification-service';

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

    // Obtener información completa de la propiedad para las notificaciones
    const { data: publishedProperty } = await supabase
      .from("properties")
      .select("id, title, property_type, operation_type, price")
      .eq("id", params.id)
      .single();

    if (publishedProperty) {
      // Obtener usuarios que tienen esta propiedad en favoritos
      const { data: favorites } = await supabase
        .from("favorites")
        .select("user_id")
        .eq("property_id", params.id);

      // Enviar notificación a cada usuario que tiene la propiedad en favoritos
      if (favorites && favorites.length > 0) {
        const operationType = publishedProperty.operation_type === 'sale' ? 'venta' : 'alquiler';

        for (const favorite of favorites) {
          sendNotification({
            userId: favorite.user_id,
            type: 'FAVORITE_PROPERTY_UPDATED',
            title: 'Propiedad favorita actualizada',
            message: `La propiedad "${publishedProperty.title}" que guardaste en favoritos ha sido publicada y está disponible para ${operationType}.`,
            channels: ['in_app', 'email'],
            metadata: {
              propertyId: publishedProperty.id,
              propertyTitle: publishedProperty.title,
              propertyType: publishedProperty.property_type,
              operationType: publishedProperty.operation_type,
              price: publishedProperty.price,
              ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/propiedades/${publishedProperty.id}`,
              ctaText: 'Ver propiedad'
            },
            relatedId: publishedProperty.id,
            relatedType: 'property'
          }).catch(err => {
            console.error('[Publish] Error sending favorite notification:', err);
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "INTERNAL_ERROR" }, { status: 500 });
  }
}
