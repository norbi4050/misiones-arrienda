'use client'

/**
 * [AuthBridge] Unified Authentication Hook
 * 
 * Hook unificado que reemplaza useAuth y useSupabaseAuth
 * Fuente única de verdad para autenticación en toda la app
 */

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowser } from 'lib/supabase/browser'
import { useRouter } from 'next/navigation'
import { mapUserProfile, type CurrentUser, isAgency } from './mapUserProfile'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export interface UseCurrentUserReturn {
  user: CurrentUser | null
  isAuthenticated: boolean
  isAgency: boolean
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Hook unificado de autenticación
 * 
 * Reemplaza a useAuth y useSupabaseAuth
 * Siempre retorna datos normalizados en camelCase
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  /**
   * Obtiene el perfil del usuario desde la API
   * Usa /api/users/profile que ya maneja la lógica de obtener datos
   */
  const fetchUserProfile = useCallback(async (userId: string): Promise<CurrentUser | null> => {
    try {
      console.log('[AuthBridge] Fetching profile for user:', userId)

      // Agregar timeout de 10 segundos para evitar que se quede esperando indefinidamente
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
        console.error('[AuthBridge] Profile fetch failed:', response.status, errorData)
        return null
      }

      const { profile } = await response.json()

      if (!profile) {
        console.warn('[AuthBridge] No profile data returned from API')
        return null
      }

      // El endpoint /api/users/profile YA usa mapUserProfile
      // NO volver a mapear aquí para evitar doble normalización
      console.log('[AuthBridge] Profile received from API:', {
        id: profile.id,
        email: profile.email,
        userType: profile.userType,
        isCompany: profile.isCompany,
        isAgency: isAgency(profile),
      })

      return profile as CurrentUser
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[AuthBridge] Profile fetch timed out after 10s')
      } else {
        console.error('[AuthBridge] Error fetching profile:', error)
      }
      return null
    }
  }, [])

  /**
   * Refresca el perfil del usuario
   */
  const refresh = useCallback(async () => {
    console.log('[AuthBridge] Refreshing user profile')
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
      console.error('[AuthBridge] Error refreshing profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, fetchUserProfile])

  /**
   * Cierra sesión
   */
  const signOut = useCallback(async () => {
    try {
      console.log('[AuthBridge] Signing out')
      await supabase.auth.signOut()
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('[AuthBridge] Error signing out:', error)
    }
  }, [supabase.auth, router])

  /**
   * Efecto principal: Obtener sesión inicial y escuchar cambios
   */
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('[AuthBridge] Initializing auth')
        
        // Obtener sesión actual
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthBridge] Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (session?.user && mounted) {
          console.log('[AuthBridge] Session found, fetching profile')
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile)
          }
        } else if (mounted) {
          console.log('[AuthBridge] No session found')
          setUser(null)
        }
      } catch (error) {
        console.error('[AuthBridge] Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

        console.log('[AuthBridge] Auth state changed:', event)

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
          // Refrescar perfil cuando se refresca el token
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile)
          }
        }
      }
    )

    // FIX: Escuchar evento de perfil actualizado (ej: después de subir avatar)
    const handleProfileUpdate = async () => {
      if (!mounted) return
      console.log('[AuthBridge] Profile update event received, refreshing...')
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
    }
  }, [supabase.auth, fetchUserProfile])

  return {
    user,
    isAuthenticated: !!user,
    isAgency: isAgency(user),
    loading,
    refresh,
    signOut,
  }
}

/**
 * Alias temporal para compatibilidad con código existente
 * @deprecated Use useCurrentUser instead
 */
export const useAuth = useCurrentUser
