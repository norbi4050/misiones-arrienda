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
  name?: string;
  phone?: string;

  // User type and company fields (from users table)
  userType?: string;
  isCompany?: boolean;
  companyName?: string;
  licenseNumber?: string;
  propertyCount?: number;
  isVerified?: boolean;
  emailVerified?: boolean;

  // Profile fields (from user_profiles table)
  bio?: string;
  role?: string;
  city?: string;
  neighborhood?: string;
  budgetMin?: number;
  budgetMax?: number;
  avatar_url?: string;

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
      email: currentUser.email,
      name: currentUser.name,
      phone: currentUser.phone,
      userType: currentUser.userType,
      isCompany: currentUser.userType === 'inmobiliaria',
      companyName: currentUser.companyName,
      licenseNumber: currentUser.licenseNumber,
      propertyCount: 0, // Not available in CurrentUser
      isVerified: currentUser.isVerified,
      emailVerified: currentUser.email_verified,
      bio: currentUser.bio,
      role: currentUser.role,
      city: currentUser.city,
      neighborhood: currentUser.neighborhood,
      budgetMin: currentUser.budget_min,
      budgetMax: currentUser.budget_max,
      avatar_url: currentUser.avatar_url,
      created_at: currentUser.created_at,
      updated_at: currentUser.updated_at,
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
