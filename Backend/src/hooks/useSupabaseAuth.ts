"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export function useSupabaseAuth() {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error) {
          console.error('Auth error:', error);
          setError(error.message);
        } else {
          setError(null);
        }

        setSession(session);
        setUser(session?.user ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!alive) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'Error al cerrar sesión');
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      setError(null);

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Actualizar el perfil del usuario en Supabase Auth si hay datos de auth
      const authUpdates: any = {};
      if (profileData.email && profileData.email !== user.email) {
        authUpdates.email = profileData.email;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) {
          throw new Error(authError.message);
        }
      }

      // Preparar datos para actualizar, filtrando valores undefined
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Solo agregar campos que no sean undefined
      if (profileData.name !== undefined) updateData.name = profileData.name;
      if (profileData.phone !== undefined) updateData.phone = profileData.phone;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.location !== undefined) updateData.location = profileData.location;
      if (profileData.search_type !== undefined) updateData.search_type = profileData.search_type;
      if (profileData.budget_range !== undefined) updateData.budget_range = profileData.budget_range;
      if (profileData.preferred_areas !== undefined) updateData.preferred_areas = profileData.preferred_areas;
      if (profileData.family_size !== undefined) updateData.family_size = profileData.family_size;
      if (profileData.pet_friendly !== undefined) updateData.pet_friendly = profileData.pet_friendly;
      if (profileData.move_in_date !== undefined) updateData.move_in_date = profileData.move_in_date;
      if (profileData.employment_status !== undefined) updateData.employment_status = profileData.employment_status;
      if (profileData.monthly_income !== undefined) updateData.monthly_income = profileData.monthly_income;
      if (profileData.profile_image !== undefined) updateData.profile_image = profileData.profile_image;

      // Actualizar datos adicionales del perfil en la tabla de usuarios
      const { error: profileError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Refrescar los datos del usuario
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar perfil';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, userData: any = {}) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al registrar usuario';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    session,
    loading,
    error,
    isLoading: loading, // Alias para compatibilidad
    signOut,
    login,
    register,
    updateProfile,
    isAuthenticated: !!user && !!session
  };
}
