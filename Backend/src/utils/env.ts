/**
 * Environment variables helper
 * Centraliza el acceso a variables de entorno con valores por defecto seguros
 */

// GUARD: Feature flag para soft-guard en /comunidad
// Si es 'false' explícitamente, mantiene el redirect legacy (307)
// Si es 'true' o no está definida, usa soft-guard (sin redirect)
export const FEATURE_COMMUNITY_SOFT_GUARD = 
  process.env.NEXT_PUBLIC_FEATURE_COMMUNITY_SOFT_GUARD !== 'false';

// GUARD: Feature flag para modo de presencia
// 'realtime' = Usa Supabase Realtime Presence (sin writes a DB)
// 'db' = Usa sistema legacy basado en tablas (polling + updates)
// Default: 'realtime' (nuevo sistema)
export type PresenceMode = 'realtime' | 'db';

export function getPresenceMode(): PresenceMode {
  const mode = process.env.NEXT_PUBLIC_PRESENCE_MODE;
  
  if (mode === 'db') {
    return 'db';
  }
  
  // Default: realtime (nuevo sistema)
  return 'realtime';
}

// Otras variables de entorno pueden agregarse aquí en el futuro
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
