'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfilePersistence } from '@/lib/profile-persistence';

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Crear cliente de Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchUserProfile = async (userId: string, useCache: boolean = true): Promise<User | null> => {
    try {
      setError(null);
      
      // Try to get profile using persistence utility with fallback strategy
      if (useCache) {
        const profile = await ProfilePersistence.getProfile(userId);
        if (profile) {
          console.log('Profile loaded from persistence utility:', profile.id);
          return profile;
        }
      }

      // Fallback to direct API call
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `HTTP ${response.status}: Error obteniendo perfil`;
        
        // Handle specific permission errors more gracefully
        if (response.status === 500 && errorMessage.includes('permission denied')) {
          console.warn('Permission denied error detected, this may be resolved automatically:', errorMessage);
          errorMessage = 'Configurando perfil de usuario...';
        } else if (response.status === 404) {
          console.log('Profile not found, will be created automatically');
          errorMessage = 'Creando perfil de usuario...';
        } else if (response.status === 401) {
          console.warn('Authentication error:', errorMessage);
          errorMessage = 'Error de autenticación';
        }
        
        console.warn('Profile fetch failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const { profile } = await response.json();
      
      // Save to cache for future use
      if (profile) {
        ProfilePersistence.saveProfile(profile);
      }
      
      return profile;
    } catch (error) {
      console.error('Error en fetchUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo perfil';
      
      // Handle permission denied errors specifically
      if (errorMessage.includes('permission denied') || errorMessage.includes('Permission denied')) {
        setError('Permission denied: Unable to create or access user profile. This may be due to database permissions.');
        
        // Don't try cache for permission errors - they need to be resolved
        return null;
      }
      
      setError(errorMessage);
      
      // Try to get cached profile as last resort for other errors
      if (useCache) {
        const cachedProfile = ProfilePersistence.getCachedProfile();
        if (cachedProfile) {
          console.log('Using cached profile as fallback:', cachedProfile.id);
          return cachedProfile;
        }
      }
      
      return null;
    }
  };

  const refreshProfile = async (userId: string): Promise<User | null> => {
    try {
      setLoading(true);
      const profile = await fetchUserProfile(userId, false); // Force fresh fetch
      if (profile) {
        setUser(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        // Try to load cached profile first for immediate UI update
        const cachedProfile = ProfilePersistence.getCachedProfile();
        if (cachedProfile && ProfilePersistence.isCacheValid() && mounted) {
          setUser(cachedProfile);
          setLoading(false);
          console.log('Loaded cached profile on initialization:', cachedProfile.id);
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error obteniendo sesión:', error);
          setError(error.message);
          ProfilePersistence.handleSessionExpired();
          if (mounted) setLoading(false);
          return;
        }

        setSession(session);
        
        if (session?.user && mounted) {
          // Fetch fresh profile data if we don't have cached data
          const shouldUseCache = cachedProfile ? false : true;
          const profile = await fetchUserProfile(session.user.id, shouldUseCache);
          if (profile && mounted) {
            setUser(profile);
          }
        } else if (!session && mounted) {
          // No session, clear cached data
          ProfilePersistence.clearProfile();
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error en getInitialSession:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Error de autenticación');
          setLoading(false);
        }
      } finally {
        if (mounted) {
          const cachedProfile = ProfilePersistence.getCachedProfile();
          if (!cachedProfile) {
            setLoading(false);
          }
        }
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          const profile = await fetchUserProfile(session.user.id, false); // Fresh fetch on sign in
          if (profile && mounted) {
            setUser(profile);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          ProfilePersistence.clearProfile();
          setUser(null);
          setError(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Sync profile on token refresh to ensure data is current
          const profile = await ProfilePersistence.syncProfile(session.user.id);
          if (profile && mounted) {
            setUser(profile);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const updateProfile = async (profileData: Partial<User>) => {
    if (!session?.user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      
      // Use ProfilePersistence utility for updating
      const updatedProfile = await ProfilePersistence.updateProfile(profileData);
      if (updatedProfile) {
        setUser(updatedProfile);
        return updatedProfile;
      }
      
      throw new Error('Error actualizando perfil');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setError(error instanceof Error ? error.message : 'Error actualizando perfil');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      
      // Clear cached profile data
      ProfilePersistence.clearProfile();
      setUser(null);
      setSession(null);
      router.push('/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      setError(error instanceof Error ? error.message : 'Error cerrando sesión');
    }
  };

  return {
    user,
    session,
    loading,
    error,
    updateProfile,
    signOut,
    refreshProfile: user ? () => refreshProfile(user.id) : null,
    isAuthenticated: !!session?.user
  };
}
