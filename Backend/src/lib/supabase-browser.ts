'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Variable global para memoizar el cliente
let supabaseBrowserClient: SupabaseClient | null = null;

/**
 * Obtiene una instancia única y memoizada del cliente de Supabase para el navegador
 * Evita el warning "Multiple GoTrueClient instances detected"
 */
export function getSupabaseBrowser(): SupabaseClient {
  // Si ya existe una instancia, devolverla (memoización)
  if (supabaseBrowserClient) {
    return supabaseBrowserClient;
  }

  // Validar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  // Crear nueva instancia con configuración unificada
  supabaseBrowserClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,        // ✅ Persistir sesión
        autoRefreshToken: true,      // ✅ Auto-refresh de tokens
        detectSessionInUrl: true,    // Detectar sesión en URL (OAuth)
        flowType: 'pkce',           // Flujo PKCE para seguridad
        storageKey: 'misiones-arrienda-auth', // ✅ Storage key personalizado
      },
      global: {
        headers: {
          'X-Client-Info': 'misiones-arrienda-web'
        }
      },
      // Configuración adicional para evitar múltiples instancias
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );

  return supabaseBrowserClient;
}

/**
 * Resetea la instancia memoizada (útil para testing o logout completo)
 */
export function resetSupabaseBrowserClient(): void {
  supabaseBrowserClient = null;
}

/**
 * Verifica si ya existe una instancia del cliente
 */
export function hasSupabaseBrowserClient(): boolean {
  return supabaseBrowserClient !== null;
}

// Alias para compatibilidad con código existente
export const getBrowserSupabase = getSupabaseBrowser;
export const getBrowserClient = getSupabaseBrowser;

// Export por defecto
export default getSupabaseBrowser;
