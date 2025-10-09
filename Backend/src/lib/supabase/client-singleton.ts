/**
 * Singleton de Supabase Client para Browser
 * 
 * DEPRECADO: Este archivo redirige a src/lib/supabase/browser.ts
 * para evitar múltiples instancias de GoTrueClient.
 * 
 * Usar createBrowserSupabase() o getBrowserSupabase() de @/lib/supabase/browser
 * 
 * @deprecated Use @/lib/supabase/browser instead
 * @created 2025
 */

'use client'

import { getBrowserSupabase } from './browser'

/**
 * @deprecated Use getBrowserSupabase() from @/lib/supabase/browser
 */
export function getBrowserClient() {
  return getBrowserSupabase()
}

/**
 * @deprecated Use getBrowserSupabase() from @/lib/supabase/browser
 */
export function resetBrowserClient(): void {
  // No-op: el reset se maneja en browser.ts si es necesario
  console.warn('[DEPRECATED] resetBrowserClient() is deprecated. Use browser.ts directly.')
}
