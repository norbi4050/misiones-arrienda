"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabaseClient';

// Tipos para el contexto de usuario
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  photos?: string[];
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
      localStorage.setItem(CACHE_KEYS.USER_SESSION, JSON.stringify({
        user: session.user,
        access_token: session.access_token
      }));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      }
  }, []);

  const loadFromCache = useCallback(() => {
    try {
      const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      if (!timestamp || Date.now() - parseInt(timestamp) > CACHE_DURATION) {
        clearCache();
        return null;
      }

      const cachedProfile = localStorage.getItem(CACHE_KEYS.USER_PROFILE);
      const cachedSession = localStorage.getItem(CACHE_KEYS.USER_SESSION);

      if (cachedProfile && cachedSession) {
        return {
          profile: JSON.parse(cachedProfile),
          sessionData: JSON.parse(cachedSession)
        };
      }
    } catch (error) {
      clearCache();
    }
    return null;
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEYS.USER_PROFILE);
      localStorage.removeItem(CACHE_KEYS.USER_SESSION);
      localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
    } catch (error) {
      }
  }, []);

  // Cargar perfil completo desde la API
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error loading user profile');
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, []);

  // Función para refrescar el perfil
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const profileData = await loadUserProfile(user.id);

      if (profileData) {
        setProfile(profileData);
        if (session) {
          saveToCache(profileData, session);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setError('Error al cargar el perfil');
    }
  }, [user?.id, session, loadUserProfile, saveToCache]);

  // Función de login
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

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

        // Cargar perfil completo
        const profileData = await loadUserProfile(data.user.id);
        if (profileData) {
          setProfile(profileData);
          saveToCache(profileData, data.session);
        }

        return { success: true };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase, loadUserProfile, saveToCache]);

  // Función de registro
  const register = useCallback(async (email: string, password: string, userData: any = {}) => {
    try {
      setError(null);
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Función de logout
  const signOut = useCallback(async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      clearCache();
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError('Error al cerrar sesión');
    }
  }, [supabase, clearCache]);

  // Función para actualizar perfil
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user?.id) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setError(null);

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating profile');
      }

      const result = await response.json();

      // Actualizar estado local
      setProfile(prev => prev ? { ...prev, ...data } : null);

      // Actualizar caché
      if (profile && session) {
        const updatedProfile = { ...profile, ...data };
        saveToCache(updatedProfile, session);
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user?.id, profile, session, saveToCache]);

  // Función para actualizar avatar (simplificada para usar con ProfileAvatar component)
  const updateAvatar = useCallback(async (imageUrl: string) => {
    // Esta función es llamada por el ProfileAvatar component después de un upload exitoso
    // Solo necesita actualizar el estado local con la nueva URL
    return await updateProfile({ 
      profile_image: imageUrl,
      photos: [imageUrl]
    });
  }, [updateProfile]);

  // Inicialización del contexto
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Intentar cargar desde caché primero
        const cached = loadFromCache();
        if (cached && mounted) {
          setProfile(cached.profile);
          setUser(cached.sessionData.user);
          // No establecer session desde caché por seguridad
        }

        // Obtener sesión actual de Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Auth error:', error);
          setError(error.message);
          clearCache();
        } else if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Cargar perfil completo si no está en caché o está desactualizado
          if (!cached || cached.sessionData.user.id !== session.user.id) {
            const profileData = await loadUserProfile(session.user.id);
            if (profileData && mounted) {
              setProfile(profileData);
              saveToCache(profileData, session);
            }
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
