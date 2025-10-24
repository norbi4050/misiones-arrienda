'use client'

/**
 * [AuthBridge] Global Authentication Context Provider
 *
 * Provides a singleton auth state shared across all components
 * Prevents multiple simultaneous initializations of auth
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createSupabaseBrowser } from 'lib/supabase/browser'
import { useRouter } from 'next/navigation'
import { mapUserProfile, type CurrentUser, isAgency } from './mapUserProfile'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  user: CurrentUser | null
  isAuthenticated: boolean
  isAgency: boolean
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Singleton flag to prevent multiple initializations
let isInitialized = false

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  /**
   * Obtiene el perfil del usuario desde la API
   */
  const fetchUserProfile = useCallback(async (userId: string): Promise<CurrentUser | null> => {
    try {
      console.log('[AuthProvider] Fetching profile for user:', userId)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[AuthProvider] Profile fetch failed:', response.status, errorData)
        return null
      }

      const { profile } = await response.json()

      if (!profile) {
        console.warn('[AuthProvider] No profile data returned from API')
        return null
      }

      console.log('[AuthProvider] Profile received:', {
        id: profile.id,
        email: profile.email,
        userType: profile.userType,
        isCompany: profile.isCompany,
        isAgency: isAgency(profile),
      })

      return profile as CurrentUser
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[AuthProvider] Profile fetch timed out after 10s')
      } else {
        console.error('[AuthProvider] Error fetching profile:', error)
      }
      return null
    }
  }, [])

  /**
   * Refresca el perfil del usuario
   */
  const refresh = useCallback(async () => {
    console.log('[AuthProvider] Refreshing user profile')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('[AuthProvider] Error refreshing profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, fetchUserProfile])

  /**
   * Cierra sesión
   */
  const signOut = useCallback(async () => {
    try {
      console.log('[AuthProvider] Signing out')
      await supabase.auth.signOut()
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('[AuthProvider] Error signing out:', error)
    }
  }, [supabase.auth, router])

  /**
   * Efecto principal: Obtener sesión inicial y escuchar cambios
   */
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log('[AuthProvider] Already initialized, skipping')
      return
    }

    isInitialized = true
    let mounted = true

    const initializeAuth = async () => {
      // Safety timeout: force loading to false after 12 seconds
      const safetyTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('[AuthProvider] Safety timeout reached, forcing loading to false')
          setLoading(false)
        }
      }, 12000)

      try {
        console.log('[AuthProvider] Initializing auth (singleton)')

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthProvider] Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          clearTimeout(safetyTimeout)
          return
        }

        if (session?.user && mounted) {
          console.log('[AuthProvider] Session found, fetching profile')
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            console.log('[AuthProvider] Setting user:', profile ? 'success' : 'null')
            setUser(profile)
          }
        } else if (mounted) {
          console.log('[AuthProvider] No session found')
          setUser(null)
        }
      } catch (error) {
        console.error('[AuthProvider] Error initializing auth:', error)
      } finally {
        clearTimeout(safetyTimeout)
        if (mounted) {
          console.log('[AuthProvider] Setting loading to false')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

        console.log('[AuthProvider] Auth state changed:', event)

        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true)
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile)
            setLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile)
          }
        }
      }
    )

    // Escuchar evento de perfil actualizado
    const handleProfileUpdate = async () => {
      if (!mounted) return
      console.log('[AuthProvider] Profile update event received, refreshing...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        if (mounted) {
          setUser(profile)
        }
      }
    }

    window.addEventListener('profile-updated', handleProfileUpdate)

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('profile-updated', handleProfileUpdate)
      isInitialized = false // Reset on cleanup
    }
  }, [supabase.auth, fetchUserProfile])

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAgency: isAgency(user),
    loading,
    refresh,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

/**
 * Alias for backward compatibility
 */
export const useCurrentUser = useAuth
