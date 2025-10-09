import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { id } = await req.json()
  const supabase = createClient() // SSR client con cookies
  const { error } = await supabase.rpc('property_renew', { p_id: id })
  return Response.json({ ok: !error }, { status: error ? 400 : 200 })
}
