// src/app/settings/account/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from './account-client'

export const metadata = {
  title: 'Configuración de Cuenta | Misiones Arrienda',
  description: 'Administra la configuración de tu cuenta'
}

export default async function AccountSettingsPage() {
  const supabase = createClient()
  
  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login?redirect=/settings/account')
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return <AccountClient initialProfile={profile} />
}
