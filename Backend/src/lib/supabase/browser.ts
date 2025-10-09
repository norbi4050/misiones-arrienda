import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabase() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storageKey: "misiones-arrienda-auth",
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }
  return _client;
}

export function getBrowserSupabase() {
  return createBrowserSupabase();
}
