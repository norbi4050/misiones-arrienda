'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/lib/auth/AuthProvider'

/**
 * Hook para verificar si el usuario actual es administrador
 * Hace una verificación server-side para mayor seguridad
 */
export function useIsAdmin() {
  const { user, isAuthenticated, loading: userLoading } = useCurrentUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (userLoading) {
        return
      }

      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        // Verificar con el servidor si el usuario es admin
        const response = await fetch('/api/admin/check', {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin || false)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('[useIsAdmin] Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [user, isAuthenticated, userLoading])

  return { isAdmin, loading: loading || userLoading }
}
