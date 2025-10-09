import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

// Legacy profile page replaced with a server-side redirect to the advanced profile.
// Keeps route compatibility while removing old localStorage/token logic.
export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Redirect to the advanced inquilino profile (current supported flow)
  redirect('/profile/inquilino')
}
