// app/(private)/layout.tsx (ejemplo)
import { createSupabaseServer } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login') // o la ruta que uses
  }

  return <>{children}</>
}
