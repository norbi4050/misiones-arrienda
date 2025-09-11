"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function useSupabaseAuth() {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!alive) return;
        if (error) console.error(error);
        setUser(session?.user ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { 
    user, 
    loading, 
    signOut,
    isAuthenticated: !!user 
  };
}
