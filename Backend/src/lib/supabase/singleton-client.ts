'use client';

// Adaptador seguro: NO instanciar en scope de módulo
import { createClient, SupabaseClient } from './client';

let supabaseClient: SupabaseClient | null = null;

/** Usa SIEMPRE la misma instancia singleton */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

// (Opcional) Marcá obsoleto cualquier export previo:
// export const supabase = undefined as never; // evita uso accidental
