"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const supabase = getBrowserSupabase();
  const router = useRouter();

  const hydratedRef = useRef(false);
  const refreshLock = useRef(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      // Debounce para que no haya refresh en cascada
      if (["SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        if (refreshLock.current) return;
        refreshLock.current = true;
        router.refresh();
        setTimeout(() => (refreshLock.current = false), 300);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, initialSession]);

  return <>{children}</>;
}
