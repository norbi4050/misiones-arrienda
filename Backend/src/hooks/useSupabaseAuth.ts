"use client"

import { useState, useEffect, useRef } from 'react'
import { createSupabaseBrowser } from 'lib/supabase/browser'
import { useRouter } from 'next/navigation'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { ensureProfile } from 'src/lib/auth/ensureProfile'

const supabase = createSupabaseBrowser()

// PERF: Caché global de sesión con TTL (60 segundos)
let sessionCache: { at: number; session: Session | null } | null = null
const SESSION_CACHE_TTL = 60_000 // 60 segundos

interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  searchType?: string
  budgetRange?: string
  bio?: string
  profileImage?: string
  preferredAreas?: string
  familySize?: string
  petFriendly?: string
  moveInDate?: string
  employmentStatus?: string
  monthlyIncome?: string
  userType?: string
  companyName?: string
  licenseNumber?: string
  // Campos adicionales de la tabla users
  avatar?: string
  occupation?: string
  age?: number
  verified?: boolean
  rating?: number
  reviewCount?: number
  fullName?: string
  createdAt?: string
  updatedAt?: string
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()
  const fetchingRef = useRef<Promise<any> | null>(null)

  // Función para obtener datos completos del usuario desde la tabla users
  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, phone, avatar, bio, occupation, age, user_type,
          company_name, license_number, property_count,
          verified, email_verified, rating, review_count, created_at, updated_at
        `)
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      if (!data) {
        return null
      }

      // Mapear campos de la tabla users (snake_case -> camelCase)
      const userProfile: AuthUser = {
        id: data.id,
        name: data.name || 'Usuario',
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        profileImage: data.avatar,
        userType: data.user_type,
        companyName: data.company_name,
        licenseNumber: data.license_number,
        avatar: data.avatar,
        occupation: data.occupation,
        age: data.age,
        verified: data.verified,
        rating: data.rating,
        reviewCount: data.review_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return userProfile
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true

    // Obtener sesión inicial con caché
    const getInitialSession = async () => {
      try {
        const now = Date.now()

        // PERF: Cache hit - usar sesión cacheada si es reciente
        if (sessionCache && now - sessionCache.at < SESSION_CACHE_TTL) {
          console.debug('[useSupabaseAuth] Cache HIT - usando sesión cacheada')
          if (isMounted) {
            setSession(sessionCache.session)
            
            if (sessionCache.session?.user) {
              const userProfile = await fetchUserProfile(sessionCache.session.user.id)
              if (userProfile && isMounted) {
                setUser(userProfile)
              }
            }
            
            setIsLoading(false)
          }
          return
        }

        // PERF: Dedupe concurrent fetches
        if (!fetchingRef.current) {
          console.debug('[useSupabaseAuth] Cache MISS - fetching nueva sesión')
          fetchingRef.current = supabase.auth.getSession().finally(() => {
            fetchingRef.current = null
          })
        }

        const { data: { session }, error } = await fetchingRef.current

        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) setIsLoading(false)
          return
        }

        // PERF: Actualizar caché
        sessionCache = { at: Date.now(), session }

        if (isMounted) {
          setSession(session)

          if (session?.user) {
            // Obtener datos completos de la tabla users
            const userProfile = await fetchUserProfile(session.user.id)

            if (userProfile && isMounted) {
              setUser(userProfile)
            } else if (isMounted) {
              // Fallback a user_metadata si no hay datos en tabla users
              const authUser: AuthUser = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
                email: session.user.email || '',
                userType: session.user.user_metadata?.userType || 'inquilino',
                companyName: session.user.user_metadata?.companyName,
                licenseNumber: session.user.user_metadata?.licenseNumber
              }
              setUser(authUser)
            }
          } else {
            setUser(null)
          }

          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.email)

        if (!isMounted) return

        // PERF: Invalidar caché al cambiar auth
        sessionCache = { at: Date.now(), session }
        
        setSession(session)

        if (session?.user) {
          // Obtener datos completos de la tabla users
          const userProfile = await fetchUserProfile(session.user.id)

          if (userProfile && isMounted) {
            setUser(userProfile)
          } else if (isMounted) {
            // Fallback a user_metadata
            const authUser: AuthUser = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              userType: session.user.user_metadata?.userType || 'inquilino',
              companyName: session.user.user_metadata?.companyName,
              licenseNumber: session.user.user_metadata?.licenseNumber
            }
            setUser(authUser)
          }
        } else if (isMounted) {
          setUser(null)
        }

        if (isMounted) {
          setIsLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Función para refrescar datos del usuario (útil después de actualizar perfil)
  const refreshUserProfile = async () => {
    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user.id)
      if (userProfile) {
        setUser(userProfile)
      }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Asegurar que existe el perfil en user_profiles (idempotente)
      if (data.user) {
        try {
          await ensureProfile()
        } catch (profileError) {
          console.warn('[ensureProfile] signIn:', profileError)
        }
      }

      // Obtener perfil del usuario para determinar nextRoute
      let nextRoute = '/'
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id)
        if (userProfile?.userType === 'inmobiliaria') {
          nextRoute = '/mi-empresa'
        }
      }

      // Refresh router to update server components after login
      router.refresh()

      return { 
        success: true, 
        data,
        nextRoute 
      }
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

      // Refresh router to update server components after logout
      router.refresh()

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
        console.error('Register error details:', {
          message: error.message,
          code: (error as any).code,
          status: (error as any).status
        })

        // Manejar errores específicos de Supabase
        // ERROR: Usuario ya registrado
        if (error.message.includes('User already registered') ||
            error.message.includes('already been registered') ||
            error.message.includes('email address is already registered')) {
          throw new Error('Ya existe una cuenta con este email. Intenta iniciar sesión.')
        }

        // ERROR: Registro deshabilitado
        if (error.message.includes('signup is disabled')) {
          throw new Error('El registro está temporalmente deshabilitado. Contacta al administrador.')
        }

        // ERROR: Contraseña muy corta
        if (error.message.includes('Password should be at least')) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.')
        }

        // ERROR: Email inválido
        if (error.message.includes('Invalid email')) {
          throw new Error('El formato del email no es válido.')
        }

        // ERROR CRÍTICO: Contraseña débil o comprometida (código: weak_password)
        if ((error as any).code === 'weak_password' ||
            error.message.includes('weak') ||
            error.message.includes('easy to guess') ||
            error.message.includes('pwned')) {
          throw new Error('⚠️ Contraseña demasiado débil o comprometida\n\nEsta contraseña ha sido encontrada en bases de datos de contraseñas filtradas y no es segura.\n\nPor favor usa una contraseña más segura con:\n• Mínimo 8 caracteres\n• Mayúsculas y minúsculas\n• Números y símbolos especiales\n• Que NO sea una contraseña común\n\nEjemplo: MiPassword2025!@#')
        }

        throw error
      }

      // Asegurar que existe el perfil en user_profiles (idempotente)
      // Si el flujo requiere confirmación de email, esto también se ejecutará
      // en el callback de auth cuando el usuario confirme su email
      if (data.user) {
        try {
          await ensureProfile()
        } catch (profileError) {
          console.warn('[ensureProfile] signUp:', profileError)
        }
      }

      // Verificar si el usuario fue creado pero necesita confirmación
      if (data.user && !data.user.email_confirmed_at) {
        // Refresh router to update server components after registration
        router.refresh()
        return {
          success: true,
          data,
          message: 'Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.'
        }
      }

      // Refresh router to update server components after registration
      router.refresh()
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

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      })

      if (error) throw error

      return { 
        success: true, 
        message: 'Te enviamos un email con instrucciones para recuperar tu contraseña.' 
      }
    } catch (error: any) {
      console.error('Password reset request error:', error)
      return { 
        success: false, 
        error: error.message || 'Error al solicitar recuperación de contraseña' 
      }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { 
        success: true, 
        message: 'Contraseña actualizada exitosamente' 
      }
    } catch (error: any) {
      console.error('Password update error:', error)
      return { 
        success: false, 
        error: error.message || 'Error al actualizar contraseña' 
      }
    }
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    logout,
    register,
    refreshUserProfile, // Nueva función para refrescar datos
    requestPasswordReset, // Nueva función para recuperación de contraseña
    updatePassword // Nueva función para actualizar contraseña
  }
}
