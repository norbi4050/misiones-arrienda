"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  userType?: string
  companyName?: string
  licenseNumber?: string
  bio?: string
  occupation?: string
  age?: number
  phone?: string
  profileImage?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData' || e.key === 'authToken') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const checkAuth = () => {
    try {
      const userData = localStorage.getItem('userData')
      const token = localStorage.getItem('authToken')
      
      if (userData && token) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      localStorage.removeItem('userData')
      localStorage.removeItem('authToken')
    } finally {
      setIsLoading(false)
    }
  }

  const getToken = (): string | null => {
    return localStorage.getItem('authToken')
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

  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      const token = getToken()
      if (!token) {
        console.error('No token available for profile update')
        return false
      }

      console.log('Updating profile with data:', profileData)
      
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
        localStorage.setItem('userData', JSON.stringify(data.user))
        return true
      } else {
        const errorData = await response.json()
        console.error('Profile update error:', errorData.error)
        
        if (response.status === 401) {
          console.log('Token expired, logging out...')
          logout()
        }
      }
      return false
    } catch (error) {
      console.error('Profile update failed:', error)
      return false
    }
  }

  const login = (userData: User, token: string) => {
    localStorage.setItem('userData', JSON.stringify(userData))
    localStorage.setItem('authToken', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('userData')
    localStorage.removeItem('authToken')
    setUser(null)
    window.location.href = '/'
  }

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        login(data.user, data.token)
        return true
      } else {
        const errorData = await response.json()
        console.error('Registration error:', errorData.error)
        return false
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateProfile,
    getToken,
    getAuthHeaders
  }
}
