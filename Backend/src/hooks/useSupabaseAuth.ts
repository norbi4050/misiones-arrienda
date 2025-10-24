"use client"

/**
 * @deprecated This hook is deprecated. Use `useCurrentUser` from '@/lib/auth/AuthProvider' instead.
 * This wrapper is kept for backwards compatibility but will be removed in a future version.
 *
 * Migration guide:
 * - Replace `useSupabaseAuth()` with `useCurrentUser()`
 * - The new hook provides the same functionality with unified auth state
 */

import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { createSupabaseBrowser } from 'lib/supabase/browser'
import { useRouter } from 'next/navigation'
import { ensureProfile } from 'src/lib/auth/ensureProfile'
import { useMemo } from 'react'

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

/**
 * Legacy auth hook - wraps the new useCurrentUser for backwards compatibility
 */
export function useSupabaseAuth() {
  const { user: currentUser, loading, refresh, signOut: signOutFromProvider } = useCurrentUser()
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  // Map CurrentUser to AuthUser format for backwards compatibility
  const user: AuthUser | null = useMemo(() => {
    if (!currentUser) return null

    return {
      id: currentUser.id,
      name: currentUser.name || 'Usuario',
      email: currentUser.email,
      phone: currentUser.phone,
      bio: currentUser.bio,
      profileImage: currentUser.avatar_url,
      userType: currentUser.userType,
      companyName: currentUser.companyName,
      licenseNumber: currentUser.licenseNumber,
      avatar: currentUser.avatar_url,
      verified: currentUser.isVerified,
      createdAt: currentUser.created_at,
      updatedAt: currentUser.updated_at,
    }
  }, [currentUser])

  // Función para refrescar datos del usuario
  const refreshUserProfile = async () => {
    await refresh()
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Asegurar que existe el perfil en user_profiles
      if (data.user) {
        try {
          await ensureProfile()
        } catch (profileError) {
          console.warn('[ensureProfile] signIn:', profileError)
        }
      }

      // Esperar a que el AuthProvider actualice el estado
      await refresh()

      // Determinar ruta de redirección basada en userType
      let nextRoute = '/'
      if (currentUser?.userType === 'inmobiliaria') {
        nextRoute = '/mi-empresa'
      }

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
      await signOutFromProvider()
      return { success: true }
    } catch (error: any) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  }

  const register = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: userData
        }
      })

      if (error) {
        console.error('Register error details:', {
          message: error.message,
          code: (error as any).code,
          status: (error as any).status
        })

        // Manejar errores específicos de Supabase
        if (error.message.includes('User already registered') ||
            error.message.includes('already been registered') ||
            error.message.includes('email address is already registered')) {
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

        if ((error as any).code === 'weak_password' ||
            error.message.includes('weak') ||
            error.message.includes('easy to guess') ||
            error.message.includes('pwned')) {
          throw new Error('⚠️ Contraseña demasiado débil o comprometida\n\nEsta contraseña ha sido encontrada en bases de datos de contraseñas filtradas y no es segura.\n\nPor favor usa una contraseña más segura con:\n• Mínimo 8 caracteres\n• Mayúsculas y minúsculas\n• Números y símbolos especiales\n• Que NO sea una contraseña común\n\nEjemplo: MiPassword2025!@#')
        }

        throw error
      }

      // Asegurar que existe el perfil en user_profiles
      if (data.user) {
        try {
          await ensureProfile()
        } catch (profileError) {
          console.warn('[ensureProfile] signUp:', profileError)
        }
      }

      // Verificar si el usuario fue creado pero necesita confirmación
      if (data.user && !data.user.email_confirmed_at) {
        router.refresh()
        return {
          success: true,
          data,
          message: 'Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.'
        }
      }

      router.refresh()
      return { success: true, data }
    } catch (error: any) {
      console.error('Register error:', error)

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
    session: null, // Session is managed internally by AuthProvider
    isLoading: loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshUserProfile,
    requestPasswordReset,
    updatePassword
  }
}
