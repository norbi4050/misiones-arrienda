'use client';

/**
 * @deprecated This hook is deprecated. Use `useCurrentUser` from '@/lib/auth/AuthProvider' instead.
 * This wrapper is kept for backwards compatibility but will be removed in a future version.
 *
 * Migration guide:
 * - Replace `useAuth()` with `useCurrentUser()`
 * - The new hook provides the same functionality with unified auth state
 */

import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { useMemo } from 'react'

export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;

  // User type and company fields (from users table)
  userType?: string | null;
  isCompany?: boolean;
  companyName?: string | null;
  licenseNumber?: string | null;
  propertyCount?: number;
  isVerified?: boolean;
  emailVerified?: boolean;

  // Profile fields (from user_profiles table)
  bio?: string | null;
  role?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  budgetMin?: number;
  budgetMax?: number;
  avatar_url?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Legacy auth hook - wraps the new useCurrentUser for backwards compatibility
 */
export function useAuth() {
  const { user: currentUser, loading, isAuthenticated, refresh, signOut: signOutFromProvider } = useCurrentUser()

  // Map CurrentUser to User format for backwards compatibility
  const user: User | null = useMemo(() => {
    if (!currentUser) return null

    return {
      id: currentUser.id,
      email: currentUser.email || '',
      name: currentUser.name,
      phone: currentUser.phone,
      userType: currentUser.userType,
      isCompany: currentUser.userType === 'inmobiliaria',
      companyName: currentUser.companyName,
      licenseNumber: currentUser.licenseNumber,
      propertyCount: 0, // Not available in CurrentUser
      isVerified: currentUser.verified || false,
      emailVerified: currentUser.emailVerified || false,
      bio: currentUser.bio,
      role: undefined, // Not available in CurrentUser
      city: undefined, // Not available in CurrentUser
      neighborhood: undefined, // Not available in CurrentUser
      budgetMin: undefined, // Not available in CurrentUser
      budgetMax: undefined, // Not available in CurrentUser
      avatar_url: currentUser.avatar,
      created_at: currentUser.createdAt || '',
      updated_at: currentUser.updatedAt || '',
    }
  }, [currentUser])

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Call API to update profile
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating profile');
      }

      const { profile } = await response.json();

      // Refresh auth state
      await refresh()

      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await signOutFromProvider()
  };

  const refreshProfile = user ? async () => {
    await refresh()
    return user
  } : null;

  return {
    user,
    session: null, // Session is managed internally by AuthProvider
    loading,
    error: null,
    updateProfile,
    signOut,
    refreshProfile,
    isAuthenticated
  };
}
