"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  userType?: string // inquilino, dueno_directo, inmobiliaria
  companyName?: string // Solo para inmobiliarias
  licenseNumber?: string // Solo para inmobiliarias
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario logueado en localStorage
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('userData')
        const token = localStorage.getItem('authToken')
        
        if (userData && token) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // Limpiar datos corruptos
        localStorage.removeItem('userData')
        localStorage.removeItem('authToken')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Escuchar cambios en localStorage (para cuando se loguea/desloguea en otra pestaña)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData' || e.key === 'authToken') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (userData: User, token: string) => {
    localStorage.setItem('userData', JSON.stringify(userData))
    localStorage.setItem('authToken', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('userData')
    localStorage.removeItem('authToken')
    setUser(null)
    // Redirigir a la página principal
    window.location.href = '/'
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  }
}
