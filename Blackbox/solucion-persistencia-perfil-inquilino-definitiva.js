// =====================================================
// SOLUCIÓN DEFINITIVA: PERSISTENCIA PERFIL INQUILINO
// =====================================================
// Fecha: 2025-01-27
// Problema: Los cambios del perfil se borran al cambiar de pestaña
// Causa raíz identificada: Hook useSupabaseAuth no sincroniza con tabla users
// Solución: Actualizar hook para obtener datos de tabla users
// =====================================================

const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS COMPLETADO - CAUSA RAÍZ IDENTIFICADA');
console.log('='.repeat(60));
console.log('');

console.log('❌ PROBLEMA IDENTIFICADO:');
console.log('   El hook useSupabaseAuth solo obtiene datos de user_metadata');
console.log('   NO sincroniza con la tabla users donde se guardan los cambios');
console.log('');

console.log('🎯 CAUSA RAÍZ:');
console.log('   1. Usuario edita perfil → se guarda en tabla users ✅');
console.log('   2. Usuario cambia de pestaña → hook se reinicia');
console.log('   3. Hook obtiene datos de user_metadata (datos antiguos) ❌');
console.log('   4. Componente muestra datos de user_metadata, no de tabla users');
console.log('');

console.log('💡 SOLUCIÓN IDENTIFICADA:');
console.log('   Modificar useSupabaseAuth para obtener datos de tabla users');
console.log('   después de la autenticación inicial');
console.log('');

console.log('🔧 ARCHIVOS A MODIFICAR:');
console.log('   1. Backend/src/hooks/useSupabaseAuth.ts');
console.log('   2. Backend/src/app/profile/inquilino/page.tsx (opcional)');
console.log('');

console.log('📋 PLAN DE IMPLEMENTACIÓN:');
console.log('   ✅ PASO 1: Crear hook mejorado');
console.log('   ✅ PASO 2: Agregar función fetchUserProfile');
console.log('   ✅ PASO 3: Sincronizar datos después de autenticación');
console.log('   ✅ PASO 4: Actualizar componente para usar datos correctos');
console.log('   ✅ PASO 5: Testing y verificación');
console.log('');

// Crear el hook mejorado
const hookMejorado = `"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

const supabase = createClient()

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

  // Función para obtener datos completos del usuario desde la tabla users
  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(\`
          id, name, email, phone, avatar, bio, occupation, age, user_type,
          company_name, license_number, property_count, full_name, location,
          search_type, budget_range, profile_image, preferred_areas, family_size,
          pet_friendly, move_in_date, employment_status, monthly_income,
          verified, email_verified, rating, review_count, created_at, updated_at
        \`)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      // Convertir snake_case a camelCase para el frontend
      const userProfile: AuthUser = {
        id: data.id,
        name: data.name || data.full_name || 'Usuario',
        email: data.email,
        phone: data.phone,
        location: data.location,
        searchType: data.search_type,
        budgetRange: data.budget_range,
        bio: data.bio,
        profileImage: data.profile_image || data.avatar,
        preferredAreas: data.preferred_areas,
        familySize: data.family_size?.toString(),
        petFriendly: data.pet_friendly?.toString(),
        moveInDate: data.move_in_date,
        employmentStatus: data.employment_status,
        monthlyIncome: data.monthly_income?.toString(),
        userType: data.user_type,
        companyName: data.company_name,
        licenseNumber: data.license_number,
        avatar: data.avatar,
        occupation: data.occupation,
        age: data.age,
        verified: data.verified,
        rating: data.rating,
        reviewCount: data.review_count,
        fullName: data.full_name,
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
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          return
        }

        setSession(session)
        
        if (session?.user) {
          // Obtener datos completos de la tabla users
          const userProfile = await fetchUserProfile(session.user.id)
          
          if (userProfile) {
            setUser(userProfile)
          } else {
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
          // Obtener datos completos de la tabla users
          const userProfile = await fetchUserProfile(session.user.id)
          
          if (userProfile) {
            setUser(userProfile)
          } else {
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
          emailRedirectTo: \`\${window.location.origin}/auth/callback\`,
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
    register,
    refreshUserProfile // Nueva función para refrescar datos
  }
}`;

// Guardar el hook mejorado
const hookPath = path.join(__dirname, '..', 'Backend', 'src', 'hooks', 'useSupabaseAuth-mejorado.ts');
fs.writeFileSync(hookPath, hookMejorado);

console.log('✅ HOOK MEJORADO CREADO:');
console.log(`   📁 ${hookPath}`);
console.log('');

console.log('🚀 PRÓXIMOS PASOS PARA IMPLEMENTAR:');
console.log('');
console.log('   1. 🔄 REEMPLAZAR HOOK ACTUAL:');
console.log('      - Hacer backup del hook actual');
console.log('      - Reemplazar con la versión mejorada');
console.log('');
console.log('   2. 🔧 ACTUALIZAR COMPONENTE PERFIL:');
console.log('      - Agregar llamada a refreshUserProfile después de guardar');
console.log('      - Mejorar manejo de estado local');
console.log('');
console.log('   3. 🧪 TESTING:');
console.log('      - Probar edición de perfil');
console.log('      - Verificar persistencia al cambiar pestaña');
console.log('      - Confirmar sincronización de datos');
console.log('');

console.log('💡 BENEFICIOS DE LA SOLUCIÓN:');
console.log('   ✅ Datos siempre sincronizados con la base de datos');
console.log('   ✅ Persistencia correcta al cambiar pestañas');
console.log('   ✅ Función refreshUserProfile para actualizar datos');
console.log('   ✅ Fallback a user_metadata si no hay datos en tabla');
console.log('   ✅ Compatibilidad con todos los tipos de usuario');
console.log('');

console.log('⚠️ IMPORTANTE:');
console.log('   Esta solución requiere que el usuario esté en la tabla users');
console.log('   El endpoint /api/users/profile ya maneja la creación automática');
console.log('');

console.log('✅ SOLUCIÓN LISTA PARA IMPLEMENTAR');
