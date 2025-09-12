'use client';
// Adaptador: conserva firma funcional, sin instanciar en módulo
import { createClient } from './supabase/client';

export function getBrowserSupabase() {
  return createClient();
}
// No exportes un 'supabase' listo; obligamos a llamar a la función.
