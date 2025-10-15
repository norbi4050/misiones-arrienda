"use client"

import React, { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getBrowserSupabase } from "@/lib/supabase/browser"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const supabase = getBrowserSupabase()
  const isHandlingInvalidToken = useRef(false)

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

    // Ejecutar al montar
    handleInvalidToken()

    // Listener de cambios de auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, _session: any) => {
      if (_event === 'TOKEN_REFRESHED') {
        console.log('[auth] Token refreshed successfully')
      }
      
      if (_event === 'SIGNED_OUT') {
        console.log('[auth] User signed out')
      }
      
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return <>{children}</>
}
