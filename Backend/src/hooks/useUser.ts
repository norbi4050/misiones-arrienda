"use client";

import { useContext } from 'react';
import UserContext, { type UserContextType, type UserProfile } from '@/contexts/UserContext';

// Hook principal para acceder al contexto de usuario
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Hook específico para datos de autenticación
export function useAuth() {
  const { user, session, loading, error, isAuthenticated, login, register, signOut } = useUser();

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    signOut,
  };
}

// Hook específico para datos de perfil
export function useProfile() {
  const { profile, loading, error, updateProfile, updateAvatar, refreshProfile } = useUser();

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    refreshProfile,
  };
}

// Hook para verificar si el usuario está autenticado
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useUser();
  return isAuthenticated;
}

// Hook para obtener la imagen de perfil del usuario
export function useUserAvatar(): {
  avatarUrl: string | null;
  updateAvatar: (imageUrl: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
} {
  const { profile, updateAvatar, loading } = useUser();

  return {
    avatarUrl: profile?.profile_image || null,
    updateAvatar,
    loading,
  };
}

// Hook para obtener información básica del usuario
export function useUserInfo(): {
  name: string;
  email: string;
  avatarUrl: string | null;
  isVerified: boolean;
  loading: boolean;
} {
  const { user, profile, loading } = useUser();

  return {
    name: profile?.name || user?.email?.split('@')[0] || 'Usuario',
    email: user?.email || '',
    avatarUrl: profile?.profile_image || null,
    isVerified: profile?.verified || false,
    loading,
  };
}

// Hook para manejar el estado de carga
export function useUserLoading(): boolean {
  const { loading } = useUser();
  return loading;
}

// Hook para manejar errores de usuario
export function useUserError(): string | null {
  const { error } = useUser();
  return error;
}

// Hook para operaciones de perfil con validación
export function useProfileOperations() {
  const { profile, updateProfile, refreshProfile, isAuthenticated } = useUser();

  const updateProfileSafe = async (data: Partial<UserProfile>) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    return await updateProfile(data);
  };

  const refreshProfileSafe = async () => {
    if (!isAuthenticated) {
      return;
    }

    await refreshProfile();
  };

  return {
    profile,
    updateProfile: updateProfileSafe,
    refreshProfile: refreshProfileSafe,
    hasProfile: !!profile,
  };
}

// Hook para verificar permisos específicos
export function useUserPermissions() {
  const { user, profile, isAuthenticated } = useUser();

  const canEditProfile = isAuthenticated && !!user;
  const canUploadAvatar = isAuthenticated && !!user;
  const canViewPrivateContent = isAuthenticated && !!profile;
  const isProfileComplete = !!(
    profile?.name &&
    profile?.email &&
    profile?.phone
  );

  return {
    canEditProfile,
    canUploadAvatar,
    canViewPrivateContent,
    isProfileComplete,
  };
}

// Hook para datos de sesión
export function useSession() {
  const { session, user } = useUser();

  return {
    session,
    user,
    isActive: !!session && !!user,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
  };
}

// Hook para caché de usuario
export function useUserCache() {
  const { clearCache } = useUser();

  const clearUserCache = () => {
    clearCache();
  };

  return {
    clearCache: clearUserCache,
  };
}

// Hook combinado para componentes que necesitan todo
export function useUserComplete() {
  const context = useUser();

  return {
    // Estado básico
    ...context,

    // Información derivada
    displayName: context.profile?.name || context.user?.email?.split('@')[0] || 'Usuario',
    hasAvatar: !!context.profile?.profile_image,
    isProfileComplete: !!(
      context.profile?.name &&
      context.profile?.email &&
      context.profile?.phone
    ),

    // Permisos
    canEdit: context.isAuthenticated && !!context.user,
    canUpload: context.isAuthenticated && !!context.user,
  };
}

// Exportar el hook principal como default
export default useUser;
