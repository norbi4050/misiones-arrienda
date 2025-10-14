/**
 * DEPRECATED — Duplicate client creator
 * 
 * This file has been deprecated to prevent "Multiple GoTrueClient instances" warnings.
 * 
 * Original file backed up to:
 * legacy/_quarantine/20250111-22117084948F225C96715D13191D016AE13B529A/lib-supabase-browser.ts
 * 
 * SHA1: 22117084948F225C96715D13191D016AE13B529A
 * Date: 2025-01-11
 * 
 * MIGRATION: All imports should now use @/lib/supabase/browser (singleton)
 * 
 * This shim maintains backward compatibility by re-exporting from the singleton.
 */

// Re-export from the singleton to maintain backward compatibility
export { getBrowserSupabase, createBrowserSupabase } from '@/lib/supabase/browser';

/**
 * @deprecated Use getBrowserSupabase() from @/lib/supabase/browser instead
 */
export const createClient = () => {
  const { getBrowserSupabase } = require('@/lib/supabase/browser');
  return getBrowserSupabase();
};

/**
 * @deprecated Use getBrowserSupabase() from @/lib/supabase/browser instead
 */
export const createSupabaseBrowser = () => {
  const { getBrowserSupabase } = require('@/lib/supabase/browser');
  return getBrowserSupabase();
};
