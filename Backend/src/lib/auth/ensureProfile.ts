/**
 * ensureProfile.ts
 * 
 * Helper para garantizar que existe un registro en public.user_profiles
 * después de que el usuario se autentica (signUp o signIn).
 * 
 * - Usa RLS (NO service role)
 * - user_profiles.id es PK (UUID)
 * - user_profiles.userId es UNIQUE (vincula con User)
 * - role tiene default 'BUSCO' en DB → no lo enviamos desde cliente
 * - Idempotente: usa upsert con onConflict='id'
 */

import { getBrowserSupabase } from '@/lib/supabase/browser'

/**
 * Asegura que existe un perfil en user_profiles para el usuario autenticado.
 * 
 * @throws Error si no hay usuario autenticado o si falla el upsert
 */
export async function ensureProfile(): Promise<void> {
  const supabase = getBrowserSupabase()

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('No hay usuario autenticado')
  }

  // Upsert en user_profiles
  // IMPORTANTE: La PK es 'id', no 'user_id'
  // user_id es UNIQUE pero no es la PK
  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: user.id,      // PK - obligatorio para upsert
        userId: user.id,  // UNIQUE - vincula con tabla User
        // role: NO lo enviamos, usa default 'BUSCO' del schema
        // avatar_url: NO lo tocamos, se maneja en otro flujo
        // display_name: NO lo tocamos, se maneja en otro flujo
      },
      { 
        onConflict: 'id',  // PK correcta
        ignoreDuplicates: false // Actualizar si ya existe
      }
    )

  if (upsertError) {
    console.warn('[ensureProfile] upsert error', upsertError)
    throw upsertError
  }
}
