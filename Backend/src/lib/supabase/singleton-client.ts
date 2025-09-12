'use client';

// Adaptador seguro: NO instanciar en scope de módulo
import { createClient } from './client';

/** Usa SIEMPRE llamada bajo demanda */
export function getSupabaseClient() {
  return createClient();
}

// (Opcional) Marcá obsoleto cualquier export previo:
// export const supabase = undefined as never; // evita uso accidental
