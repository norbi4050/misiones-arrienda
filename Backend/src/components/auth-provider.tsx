"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const supabase = getSupabaseBrowser();
  const router = useRouter();

  const hydratedRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced router refresh para evitar múltiples refreshes
  const debouncedRefresh = useCallback((event: AuthChangeEvent) => {
    // Limpiar timeout anterior si existe
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Aplicar debounce de 300ms
    refreshTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 AuthProvider: router.refresh() por evento ${event}`);
      router.refresh();
      refreshTimeoutRef.current = null;
    }, 300);
  }, [router]);

  useEffect(() => {
    // Hidratar una sola vez desde el server
    if (!hydratedRef.current && initialSession) {
      const at = (initialSession as any).access_token;
      const rt = (initialSession as any).refresh_token;
      if (at && rt) {
        supabase.auth.setSession({ access_token: at, refresh_token: rt }).catch(console.error);
      }
      hydratedRef.current = true;
    }

    // Suscribirse a cambios de autenticación UNA SOLA VEZ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      console.log(`🔐 AuthProvider: Evento de auth recibido: ${event}`);

      // Refrescar SOLO en eventos que requieren actualización de UI
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Usuario autenticado - refrescando app');
          debouncedRefresh(event);
          break;
        
        case 'SIGNED_OUT':
          console.log('🚪 Usuario desautenticado - refrescando app');
          debouncedRefresh(event);
          break;
        
        case 'USER_UPDATED':
          console.log('👤 Datos de usuario actualizados - refrescando app');
          debouncedRefresh(event);
          break;
        
        case 'TOKEN_REFRESHED':
          // ❌ NO refrescar en TOKEN_REFRESHED para evitar "tormenta"
          console.log('🔄 Token refrescado - NO refrescando app (evitar bucles)');
          break;
        
        default:
          console.log(`ℹ️ Evento ${event} - sin acción requerida`);
          break;
      }
    });

    // Cleanup: limpiar suscripción y timeouts
    return () => {
      console.log('🧹 AuthProvider: Limpiando suscripción y timeouts');
      subscription.unsubscribe();
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [supabase, debouncedRefresh, initialSession]);

  return <>{children}</>;
}
