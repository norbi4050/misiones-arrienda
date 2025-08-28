"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  userType: 'inquilino' | 'propietario' | 'inmobiliaria'
  verified: boolean
  bio?: string
  occupation?: string
  age?: number
  phone?: string
  profileImage?: string
  companyName?: string
  licenseNumber?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  loading: boolean
  updateProfile: (profileData: any) => Promise<boolean>
  getAuthHeaders: () => { [key: string]: string }
  getToken: () => string | null
  refreshAuth: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null
    // Intentar obtener de ambos lugares para compatibilidad
    return localStorage.getItem('authToken') || localStorage.getItem('token')
  }

  const getAuthHeaders = () => {
    const token = getToken()
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  const checkAuth = async () => {
    try {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      // Verificar token con el servidor
      const response = await fetch('/api/auth/verify', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        // Token inválido o expirado
        console.log('Token verification failed, clearing auth data')
        clearAuthData()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      clearAuthData()
    } finally {
      setLoading(false)
    }
  }

  const clearAuthData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
    }
    setUser(null)
  }

  const refreshAuth = async () => {
    await checkAuth()
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token && typeof window !== 'undefined') {
          // Guardar en ambos lugares para compatibilidad
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('token', data.token)
          localStorage.setItem('userData', JSON.stringify(data.user))
          setUser(data.user)
          return true
        }
      } else {
        const errorData = await response.json()
        console.error('Login error:', errorData.error)
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: any): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('token', data.token)
          localStorage.setItem('userData', JSON.stringify(data.user))
          setUser(data.user)
        }
        return true
      } else {
        const errorData = await response.json()
        console.error('Registration error:', errorData.error)
      }
      return false
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      const token = getToken()
      if (!token) {
        console.error('No token available for profile update')
        return false
      }

      console.log('Updating profile with token:', token.substring(0, 20) + '...')
      console.log('Profile data:', profileData)
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      })

      console.log('Profile update response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Profile update successful:', data)
        setUser(data.user)
        // Actualizar localStorage también
        if (typeof window !== 'undefined') {
          localStorage.setItem('userData', JSON.stringify(data.user))
        }
        return true
      } else {
        const errorData = await response.json()
        console.error('Profile update error:', errorData.error)
        
        // Si es error 401, el token puede estar expirado
        if (response.status === 401) {
          console.log('Token expired or invalid, logging out...')
          logout()
        }
      }
      return false
    } catch (error) {
      console.error('Profile update failed:', error)
      return false
    }
  }

  const logout = () => {
    clearAuthData()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      updateProfile,
      getAuthHeaders,
      getToken,
      refreshAuth,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook simple para compatibilidad con el código existente
export function useAuthSimple() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('userData')
        const token = localStorage.getItem('authToken') || localStorage.getItem('token')
        
        if (userData && token) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        localStorage.removeItem('userData')
        localStorage.removeItem('authToken')
        localStorage.removeItem('token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData' || e.key === 'authToken' || e.key === 'token') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (userData: User, token: string) => {
    localStorage.setItem('userData', JSON.stringify(userData))
    localStorage.setItem('authToken', token)
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('userData')
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    setUser(null)
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
