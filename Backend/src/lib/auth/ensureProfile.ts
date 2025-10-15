/**
 * ensureProfile.ts
 * PROMPT 3: Helper que usa columnas REALES de user_profiles
 * 
 * - Tabla user_profiles: PK = id (UUID), columnas: display_name, avatar_url, updated_at
 * - NO tiene columna user_id ni userId
 * - Idempotente: usa insert con onConflict='id'
 * - Evita PGRST204 usando solo columnas que existen
 */

import { getBrowserSupabase } from '@/lib/supabase/browser'

/**
 * Asegura que existe un perfil básico en user_profiles.
 * Usa columnas reales: id, display_name, avatar_url, updated_at
 * 
 * @throws Error si no hay usuario autenticado o si falla el insert
 */
export async function ensureProfile(): Promise<void> {
  const supabase = getBrowserSupabase()

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('No hay usuario autenticado')
  }

  // PROMPT 3: Construir payload con columnas REALES de user_profiles
  const payload = {
    id: user.id, // PK real (UUID)
    display_name: user.user_metadata?.name 
      ?? user.email?.split('@')[0] 
      ?? 'Usuario',
    avatar_url: user.user_metadata?.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  }

  // PROMPT 3: Insert con onConflict en 'id' (PK real)
  const { error: upsertError } = await supabase
    .from('user_profiles')
    .insert(payload)
    .select()
    .single()

  // Si ya existe (conflict), hacer merge/update
  if (upsertError && upsertError.code === '23505') {
    // Conflict en PK, hacer update
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        display_name: payload.display_name,
        avatar_url: payload.avatar_url,
        updated_at: payload.updated_at,
      })
      .eq('id', user.id)

    if (updateError) {
      console.warn('[ensureProfile] update error:', updateError)
      throw updateError
    }
  } else if (upsertError) {
    console.warn('[ensureProfile] insert error:', upsertError)
    throw upsertError
  }
}
