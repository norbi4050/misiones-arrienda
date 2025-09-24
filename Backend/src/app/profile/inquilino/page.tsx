import InquilinoProfilePage from './InquilinoProfilePage'
import { InquilinoAuthCTA } from '@/components/ui/auth-cta'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  // Soft-guard: verificar auth sin redirect agresivo
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Si no hay usuario, mostrar CTA en lugar de redirect
  if (!user || error) {
    return <InquilinoAuthCTA />
  }

  // Si hay usuario, renderizar perfil
  return <InquilinoProfilePage userId={user.id} />
}
