"use client"

import React, { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getBrowserSupabase } from "@/lib/supabase/browser"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const supabase = getBrowserSupabase()
  const isHandlingInvalidToken = useRef(false)
  const hasInitializedProfile = useRef(false)

  useEffect(() => {
    // Manejar refresh token inválido al montar
    const handleInvalidToken = async () => {
      // Evitar múltiples ejecuciones simultáneas
      if (isHandlingInvalidToken.current) return
      
      try {
        isHandlingInvalidToken.current = true
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Si hay error de refresh token, hacer signOut automático
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('refresh_token_not_found')) {
          console.warn('[auth] refresh token invalid → signOut')
          await supabase.auth.signOut()
          router.refresh()
        }
      } catch (err) {
        console.error('[auth] Error checking session:', err)
      } finally {
        isHandlingInvalidToken.current = false
      }
    }

    // PROMPT 6: Fetch profile post-SIGNIN sin carrera
    const fetchProfileAfterSignIn = async () => {
      // Evitar múltiples fetches
      if (hasInitializedProfile.current) return
      
      try {
        // PROMPT 6: Esperar a que getSession() devuelva ANTES de fetch
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.access_token) {
          hasInitializedProfile.current = true
          
          // FIX-401: Construir headers con Authorization si feature flag activo
          const headers: HeadersInit = {};
          
          if (process.env.NEXT_PUBLIC_FEATURE_PROFILE_AUTH_FALLBACK === 'true' && session.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          
          // PROMPT 6: Fetch con Bearer token si existe
          await fetch('/api/users/profile', {
            headers,
            credentials: 'include', // PROMPT 6: incluir cookies
            cache: 'no-store',      // PROMPT 6: no cachear
          })
        }
      } catch (err) {
        console.error('[auth] Error fetching profile:', err)
      }
    }

    // Ejecutar al montar
    handleInvalidToken()
    fetchProfileAfterSignIn()

    // Listener de cambios de auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, _session: any) => {
      if (_event === 'TOKEN_REFRESHED') {
        console.log('[auth] Token refreshed successfully')
      }
      
      if (_event === 'SIGNED_OUT') {
        console.log('[auth] User signed out')
        hasInitializedProfile.current = false
      }
      
      // PROMPT 6: Fetch profile después de SIGNED_IN (sin carrera)
      if (_event === 'SIGNED_IN' && _session?.access_token) {
        // Esperar un tick para asegurar que la sesión está completamente establecida
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // FIX-401: Construir headers con Authorization si feature flag activo
        const headers: HeadersInit = {};
        
        if (process.env.NEXT_PUBLIC_FEATURE_PROFILE_AUTH_FALLBACK === 'true' && _session.access_token) {
          headers['Authorization'] = `Bearer ${_session.access_token}`;
        }
        
        try {
          await fetch('/api/users/profile', {
            headers,
            credentials: 'include',
            cache: 'no-store',
          })
        } catch (err) {
          console.error('[auth] Error fetching profile after SIGNED_IN:', err)
        }
      }
      
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return <>{children}</>
}
