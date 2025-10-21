/**
 * Hook: useNotifications
 *
 * Hook personalizado para gestionar notificaciones del usuario
 * - Obtiene notificaciones de la API
 * - Cuenta notificaciones no leídas
 * - Marca notificaciones como leídas
 * - Auto-refresca con SWR
 */

import useSWR from 'swr'
import { useCallback } from 'react'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'

// Tipos
export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  metadata: Record<string, any> | null
  relatedId: string | null
  relatedType: string | null
  channels: string[]
  read: boolean
  sentAt: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}

interface UseNotificationsOptions {
  unreadOnly?: boolean
  limit?: number
  enabled?: boolean // Para habilitar/deshabilitar el fetch
}

// Fetcher para SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Error al cargar notificaciones')
  }
  return res.json()
}

/**
 * Hook principal
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { unreadOnly = false, limit = 20, enabled = true } = options
  const { isAuthenticated } = useCurrentUser()

  // Construir URL con query params
  const params = new URLSearchParams()
  if (unreadOnly) params.set('unreadOnly', 'true')
  if (limit) params.set('limit', limit.toString())

  const url = isAuthenticated && enabled
    ? `/api/notifications?${params.toString()}`
    : null

  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Refrescar cada 30 segundos
    revalidateOnFocus: true,
  })

  /**
   * Marcar una notificación como leída
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      })

      if (!res.ok) {
        throw new Error('Error al marcar como leída')
      }

      // Actualizar cache local
      mutate()

      return { success: true }
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
    }
  }, [mutate])

  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      })

      if (!res.ok) {
        throw new Error('Error al marcar todas como leídas')
      }

      // Actualizar cache local
      mutate()

      return { success: true }
    } catch (err) {
      console.error('Error marking all as read:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
    }
  }, [mutate])

  /**
   * Refrescar manualmente
   */
  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  return {
    notifications: (data?.notifications as Notification[]) || [],
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}

/**
 * Hook para contador de no leídas
 */
export function useUnreadCount() {
  const { isAuthenticated } = useCurrentUser()

  const url = isAuthenticated ? '/api/notifications/unread-count' : null

  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Refrescar cada 30 segundos
    revalidateOnFocus: true,
  })

  return {
    count: data?.count || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para preferencias de notificación
 */
export function useNotificationPreferences() {
  const { isAuthenticated } = useCurrentUser()

  const url = isAuthenticated ? '/api/notifications/preferences' : null

  const { data, error, mutate, isLoading } = useSWR(url, fetcher)

  /**
   * Actualizar preferencias
   */
  const updatePreferences = useCallback(async (preferences: Record<string, boolean>) => {
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar preferencias')
      }

      // Actualizar cache local
      mutate()

      return { success: true }
    } catch (err) {
      console.error('Error updating preferences:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido'
      }
    }
  }, [mutate])

  return {
    preferences: data?.preferences || null,
    isLoading,
    error,
    updatePreferences,
    refresh: mutate,
  }
}
