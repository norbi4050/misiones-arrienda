import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const province = searchParams.get('province') ?? 'Misiones'
  const q = (searchParams.get('q') ?? '').trim()
  
  let query = supabase
    .from('geo_cities')
    .select('name,department')
    .eq('province', province)
    .order('name', { ascending: true })
    .limit(500)

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ items: data ?? [] })
}
