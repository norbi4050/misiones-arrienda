/**
 * ensureProfile.ts
 * 
 * Helper para garantizar que existe un registro en public.user_profiles
 * después de que el usuario se autentica (signUp o signIn).
 * 
 * - Usa RLS (NO service role)
 * - user_profiles.user_id es TEXT (no UUID)
 * - role tiene default 'BUSCO' en DB → no lo enviamos desde cliente
 * - Idempotente: usa upsert con onConflict
 */

import { createSupabaseBrowser } from 'lib/supabase/browser'

/**
 * Asegura que existe un perfil en user_profiles para el usuario autenticado.
 * 
 * @throws Error si no hay usuario autenticado o si falla el upsert
 */
export async function ensureProfile(): Promise<void> {
  const supabase = createSupabaseBrowser()

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('No hay usuario autenticado')
  }

  // Upsert en user_profiles
  // user.id es UUID pero la columna user_id es TEXT → JS lo maneja automáticamente
  // NO enviamos role: el default 'BUSCO' se aplica en DB
  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id, // TEXT en DB
        // role: NO lo enviamos, usa default 'BUSCO' del schema
      },
      { 
        onConflict: 'user_id',
        ignoreDuplicates: false // Actualizar si ya existe
      }
    )

  if (upsertError) {
    throw upsertError
  }
}
