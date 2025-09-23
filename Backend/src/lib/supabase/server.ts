import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

// --- COMPATIBILIDAD TEMPORAL ---
// Muchas rutas importan `createClient` desde aquí.
// Exponemos un alias para no romper la compilación mientras refactorizamos.
export const createClient = createServerSupabase

// (Opcional) helper común para leer el usuario en server:
export async function getUserServer() {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { supabase, user, error }
}
