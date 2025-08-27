"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  name: string
  email: string
  userType?: string
  companyName?: string
  licenseNumber?: string
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        setSession(session)
        
        if (session?.user) {
          // Convertir usuario de Supabase a nuestro formato
          const authUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email || '',
            userType: session.user.user_metadata?.userType || 'inquilino',
            companyName: session.user.user_metadata?.companyName,
            licenseNumber: session.user.user_metadata?.licenseNumber
          }
          setUser(authUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email || '',
            userType: session.user.user_metadata?.userType || 'inquilino',
            companyName: session.user.user_metadata?.companyName,
            licenseNumber: session.user.user_metadata?.licenseNumber
          }
          setUser(authUser)
        } else {
          setUser(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Limpiar estado local
      setUser(null)
      setSession(null)
      
      // Redirigir a la página principal
      window.location.href = '/'
    } catch (error: any) {
      console.error('Logout error:', error)
    }
  }

  const register = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: userData // Metadatos del usuario
        }
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Register error:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    logout,
    register
  }
}
