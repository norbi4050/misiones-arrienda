import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_AUTH_STORAGE_KEY } from "./constants";

// Global type declaration for HMR protection in development
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient__: ReturnType<typeof createBrowserClient> | undefined;
}

// Singleton client instance with HMR protection
let client = globalThis.__supabaseClient__;

if (!client) {
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: SUPABASE_AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  // Store in globalThis during development to prevent HMR duplicates
  if (process.env.NODE_ENV === 'development') {
    globalThis.__supabaseClient__ = client;
  }

  // Debug log to confirm single initialization (controlled by env var)
  if (process.env.NEXT_PUBLIC_DEBUG_SUPABASE === '1') {
    console.debug('[supabase] browser client init once');
  }
}

/**
 * Get the singleton Supabase browser client
 * 
 * This is the ONLY way to get a Supabase client in browser/client components.
 * DO NOT create clients directly with createBrowserClient().
 * 
 * @returns Singleton Supabase browser client
 */
export function getBrowserSupabase() {
  return client;
}

/**
 * @deprecated Use getBrowserSupabase() instead for clarity
 */
export function createBrowserSupabase() {
  return client;
}
