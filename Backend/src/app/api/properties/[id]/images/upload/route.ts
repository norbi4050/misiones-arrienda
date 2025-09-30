import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const ownerId = form.get('ownerId') as string | null
    if (!file || !ownerId) {
      return NextResponse.json({ error: 'Faltan file/ownerId' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const key = `${ownerId}/${params.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .upload(key, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      })

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    // Paso 2: Setear portada automáticamente al subir la 1ª imagen
    const { data: prop } = await supabaseAdmin
      .from('properties')
      .select('cover_path')
      .eq('id', params.id)
      .single();

    if (!prop?.cover_path) {
      await supabaseAdmin
        .from('properties')
        .update({
          cover_path: key,                          // ej: 6403f9.../89ecf1.../foto.jpg
          cover_updated_at: new Date().toISOString()
        })
        .eq('id', params.id);
    }

    const { data: signed } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key)
    return NextResponse.json({ key, url: signed.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Upload error' }, { status: 500 })
  }
}
