"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

const supabase = createClient()

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
      async (event: AuthChangeEvent, session: Session | null) => {
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

      if (error) {
        // Manejar errores específicos de Supabase
        if (error.message.includes('User already registered')) {
          throw new Error('Ya existe una cuenta con este email. Intenta iniciar sesión.')
        }
        if (error.message.includes('already been registered')) {
          throw new Error('Ya existe una cuenta con este email. Intenta iniciar sesión.')
        }
        if (error.message.includes('email address is already registered')) {
          throw new Error('Ya existe una cuenta con este email. Intenta iniciar sesión.')
        }
        if (error.message.includes('signup is disabled')) {
          throw new Error('El registro está temporalmente deshabilitado. Contacta al administrador.')
        }
        if (error.message.includes('Password should be at least')) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.')
        }
        if (error.message.includes('Invalid email')) {
          throw new Error('El formato del email no es válido.')
        }
        
        throw error
      }

      // Verificar si el usuario fue creado pero necesita confirmación
      if (data.user && !data.user.email_confirmed_at) {
        return { 
          success: true, 
          data,
          message: 'Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.'
        }
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('Register error:', error)
      
      // Mapear errores comunes a mensajes más amigables
      let errorMessage = error.message
      
      if (errorMessage.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.'
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Error de red. Intenta nuevamente.'
      }
      
      return { success: false, error: errorMessage }
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
