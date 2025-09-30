import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No auth user' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    // normalizaciones mínimas
    const phone = (body.contact_phone ?? '').trim() || null;
    const price = body.price != null ? Number(body.price) : null;

    const payload = {
      title: (body.title ?? '').slice(0, 255),
      price,                       // puede ser null
      city: body.city ?? null,     // si usás city_id, ajustá
      province: body.province ?? null,
      address: body.address ?? null,
      latitude: body.latitude ?? null,    // coordenadas del mapa
      longitude: body.longitude ?? null,  // coordenadas del mapa
      bedrooms: body.bedrooms ?? 0,
      bathrooms: body.bathrooms ?? 0,
      area_m2: body.area_m2 ?? 0,
      property_type: body.property_type ?? 'HOUSE', // mapeá a tu enum real
      user_id: user.id,           // moderno (uuid)
      user_id_text: user.id,      // legacy (text) ← ESTA LÍNEA EVITA EL 500
      contact_phone: phone ?? null,
      status: 'DRAFT',
      is_active: true,
    };

    // Validación mínima
    if (!payload.title || price === null) {
      return NextResponse.json({ error: 'title y price requeridos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('properties')
      .insert(payload)
      .select('id, user_id, user_id_text, updated_at')
      .single();

    if (error) {
      console.error('[DRAFT INSERT ERROR]', error); // ← log al server
      // devolver detalle para ver el motivo concreto
      return NextResponse.json(
        { error: error.message, code: error.code, details: (error as any).details ?? null, hint: (error as any).hint ?? null, payload },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, property: data });
  } catch (e: any) {
    console.error('[DRAFT UNCAUGHT ERROR]', e);
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
