"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabaseClient';
import { getAvatarUrl } from '@/utils/avatar';

// Tipos para el contexto de usuario
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  location?: string;
  bio?: string;
  search_type?: string;
  budget_range?: string;
  preferred_areas?: string;
  family_size?: number;
  pet_friendly?: boolean;
  move_in_date?: string;
  employment_status?: string;
  monthly_income?: number;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserContextType {
  // Estado de autenticación
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Funciones de autenticación
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, userData?: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Funciones de perfil
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (imageUrl: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;

  // Funciones de avatar con cache-busting
  getAvatarUrlWithCacheBust: () => string | null;

  // Funciones de caché
  clearCache: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Constantes para localStorage
const CACHE_KEYS = {
  USER_PROFILE: 'misiones_arrienda_user_profile',
  USER_SESSION: 'misiones_arrienda_user_session',
  CACHE_TIMESTAMP: 'misiones_arrienda_cache_timestamp'
};

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = getBrowserSupabase();

  // Estados principales
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funciones de caché
  const saveToCache = useCallback((profile: UserProfile, session: Session) => {
    try {
      localStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(profile));
      localStorage.setItem(CACHE_KEYS.USER_SESSION, JSON.stringify(session));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.warn('Error saving to cache:', error);
    }
  }, []);

  const loadFromCache = useCallback(() => {
    try {
      const cachedProfile = localStorage.getItem(CACHE_KEYS.USER_PROFILE);
      const cachedSession = localStorage.getItem(CACHE_KEYS.USER_SESSION);
      const cacheTimestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);

      if (cachedProfile && cachedSession && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;

        if (!isExpired) {
          return {
            profile: JSON.parse(cachedProfile) as UserProfile,
            session: JSON.parse(cachedSession) as Session
          };
        }
      }
    } catch (error) {
      console.warn('Error loading from cache:', error);
    }
    return null;
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEYS.USER_PROFILE);
      localStorage.removeItem(CACHE_KEYS.USER_SESSION);
      localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, []);

  // Función para obtener avatar con cache-busting
  const getAvatarUrlWithCacheBust = useCallback(() => {
    if (!profile?.profile_image) return null;
    
    return getAvatarUrl({
      profileImage: profile.profile_image,
      updatedAt: profile.updated_at
    });
  }, [profile?.profile_image, profile?.updated_at]);

  // Cargar perfil del usuario
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, [supabase]);

  // Función de login
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);

        const profileData = await loadUserProfile(data.user.id);
        if (profileData) {
          setProfile(profileData);
          saveToCache(profileData, data.session);
        }
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase, loadUserProfile, saveToCache]);

  // Función de registro
  const register = useCallback(async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
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

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Función de logout
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      clearCache();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase, clearCache]);

  // Función para actualizar perfil
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const { error } = await supabase
        .from('User')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Actualizar estado local
      setProfile(prev => prev ? { ...prev, ...data, updated_at: new Date().toISOString() } : null);

      // Refrescar perfil completo
      await refreshProfile();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: errorMessage };
    }
  }, [user, supabase]);

  // Función para actualizar avatar con cache-busting
  const updateAvatar = useCallback(async (imageUrl: string) => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('User')
        .update({
          profile_image: imageUrl,
          updated_at: now
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Actualizar estado local inmediatamente con cache-busting
      setProfile(prev => prev ? { 
        ...prev, 
        profile_image: imageUrl, 
        updated_at: now 
      } : null);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: errorMessage };
    }
  }, [user, supabase]);

  // Función para refrescar perfil
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const profileData = await loadUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        if (session) {
          saveToCache(profileData, session);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, [user, session, loadUserProfile, saveToCache]);

  // Inicialización
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Intentar cargar desde caché primero
        const cached = loadFromCache();
        if (cached && mounted) {
          setProfile(cached.profile);
          setSession(cached.session);
          setUser(cached.session.user);
        }

        // Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setSession(session);
          setUser(session.user);

          const profileData = await loadUserProfile(session.user.id);
          if (profileData && mounted) {
            setProfile(profileData);
            saveToCache(profileData, session);
          }
        } else {
          // No hay sesión activa
          setUser(null);
          setProfile(null);
          setSession(null);
          clearCache();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError('Error al inicializar autenticación');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);

          const profileData = await loadUserProfile(session.user.id);
          if (profileData && mounted) {
            setProfile(profileData);
            saveToCache(profileData, session);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSession(null);
          clearCache();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          // Mantener perfil actual, solo actualizar sesión
        }

        setLoading(false);
        setError(null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadFromCache, loadUserProfile, saveToCache, clearCache]);

  const value: UserContextType = {
    // Estado
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated: !!user && !!session,

    // Funciones de autenticación
    login,
    register,
    signOut,

    // Funciones de perfil
    updateProfile,
    updateAvatar,
    refreshProfile,

    // Funciones de avatar con cache-busting
    getAvatarUrlWithCacheBust,

    // Funciones de caché
    clearCache,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Hook de compatibilidad con el sistema anterior
export function useAuth() {
  return useUser();
}

export default UserContext;
