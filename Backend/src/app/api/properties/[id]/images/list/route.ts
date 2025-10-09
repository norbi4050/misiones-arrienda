import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const BUCKET = process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url)
    const ownerId = url.searchParams.get('ownerId')
    if (!ownerId) return NextResponse.json({ items: [], count: 0 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const prefix = `${ownerId}/${params.id}`
    const { data: items, error } = await supabaseAdmin
      .storage.from(BUCKET)
      .list(prefix, { limit: 100 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(prefix)
    const base = pub.publicUrl.replace(/\/$/, '')

    const result = (items ?? [])
      .filter(it => it.name !== '.empty') // por si creaste marcador
      .map(it => ({ key: `${prefix}/${it.name}`, url: `${base}/${it.name}` }))

    return NextResponse.json({ items: result, count: result.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'List error' }, { status: 500 })
  }
}
