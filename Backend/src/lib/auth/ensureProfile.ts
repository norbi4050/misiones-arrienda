/**
 * ensureProfile.ts
 * Helper que asegura la existencia de un perfil en user_profiles
 *
 * IMPORTANTE: user_profiles es SOLO para usuarios BUSCO/INQUILINO (funcionalidad Comunidad)
 * NO debe usarse para INMOBILIARIAS
 *
 * Columnas reales: userId, role, city, budgetMin, budgetMax, bio, photos, age,
 * petPref, smokePref, diet, scheduleNotes, tags, acceptsMessages, etc.
 */

import { getBrowserSupabase } from '@/lib/supabase/browser'

/**
 * Asegura que existe un perfil básico en user_profiles.
 * Solo crea perfiles para usuarios BUSCO/INQUILINO.
 * SKIP para usuarios INMOBILIARIA (no usan user_profiles).
 *
 * @throws Error si no hay usuario autenticado
 */
export async function ensureProfile(): Promise<void> {
  const supabase = getBrowserSupabase()

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('No hay usuario autenticado')
  }

  // SKIP para inmobiliarias - no usan user_profiles
  const userType = user.user_metadata?.userType?.toLowerCase();
  if (userType === 'inmobiliaria' || userType === 'agency') {
    console.log('[ensureProfile] SKIP - User is inmobiliaria, does not use user_profiles')
    return
  }

  // Solo crear perfil para BUSCO/INQUILINO
  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('userId', user.id)  // Columna es userId, no user_id
    .maybeSingle()

  if (existing) {
    console.log('[ensureProfile] Profile already exists, skipping')
    return
  }

  // Crear perfil mínimo para usuario BUSCO/INQUILINO
  const payload = {
    userId: user.id,
    role: userType?.toUpperCase() || 'BUSCO',
    city: null,
    budgetMin: null,
    budgetMax: null,
    bio: null,
    acceptsMessages: true,
    updatedAt: new Date().toISOString(),
  }

  const { error: insertError } = await supabase
    .from('user_profiles')
    .insert(payload)

  if (insertError) {
    // Si el error es por duplicate key (usuario ya tiene perfil), ignorar
    if (insertError.code === '23505') {
      console.log('[ensureProfile] Profile already exists (duplicate key), skipping')
      return
    }
    console.warn('[ensureProfile] insert error:', insertError)
    // No throw - el error no debe bloquear el login
  }
}
