/**
 * ensureProfile.ts
 * Helper que asegura la existencia de un perfil en user_profiles
 * 
 * - Tabla user_profiles: PK = id (UUID), columnas: display_name, avatar_url, updated_at
 * - Usa upsert nativo de Supabase para manejar conflicts automáticamente
 * - Idempotente y seguro contra errores 409
 */

import { getBrowserSupabase } from '@/lib/supabase/browser'

/**
 * Asegura que existe un perfil básico en user_profiles.
 * Usa upsert nativo de Supabase para evitar errores 409.
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

  // Construir payload con columnas REALES de user_profiles
  const payload = {
    id: user.id, // PK real (UUID)
    display_name: user.user_metadata?.name 
      ?? user.email?.split('@')[0] 
      ?? 'Usuario',
    avatar_url: user.user_metadata?.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  }

  // Usar upsert nativo de Supabase
  // onConflict: 'id' - Detecta conflict en la PK
  // ignoreDuplicates: false - Actualiza si ya existe
  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(payload, {
      onConflict: 'id',
      ignoreDuplicates: false
    })

  if (upsertError) {
    console.warn('[ensureProfile] upsert error:', upsertError)
    throw upsertError
  }
}
