"use client"

import { useState, useEffect } from 'react'
import { safeLocalStorage, safeNavigate, isClient } from '@/lib/client-utils'

interface User {
  id: string
  name: string
  email: string
}

export function useAuthSafe() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario logueado en localStorage de forma segura
    const checkAuth = () => {
      try {
        if (!isClient) {
          setIsLoading(false)
          return
        }

        const userData = safeLocalStorage.getItem('userData')
        const token = safeLocalStorage.getItem('authToken')
        
        if (userData && token) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // Limpiar datos corruptos de forma segura
        safeLocalStorage.removeItem('userData')
        safeLocalStorage.removeItem('authToken')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Escuchar cambios en localStorage solo en el cliente
    if (isClient) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'userData' || e.key === 'authToken') {
          checkAuth()
        }
      }

      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = (userData: User, token: string) => {
    if (!isClient) return
    
    safeLocalStorage.setItem('userData', JSON.stringify(userData))
    safeLocalStorage.setItem('authToken', token)
    setUser(userData)
  }

  const logout = () => {
    if (!isClient) return
    
    safeLocalStorage.removeItem('userData')
    safeLocalStorage.removeItem('authToken')
    setUser(null)
    // Usar navegación segura
    safeNavigate.push('/')
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  }
}
