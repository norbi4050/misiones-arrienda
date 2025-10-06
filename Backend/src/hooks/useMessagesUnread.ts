'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseMessagesUnreadOptions {
  pollMs?: number
  enabled?: boolean
}

export function useMessagesUnread(options: UseMessagesUnreadOptions = {}) {
  const { pollMs = 30000, enabled = true } = options
  
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) return

    try {
      const response = await fetch('/api/messages/unread-count', {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCount(data.count || 0)
        setError(null)
      } else if (response.status === 401) {
        // Usuario no autenticado - no es un error crítico
        setCount(0)
        setError(null)
      } else {
        setError('Error al obtener mensajes no leídos')
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Fetch inicial
    refresh()

    // Polling
    const interval = setInterval(refresh, pollMs)

    return () => clearInterval(interval)
  }, [refresh, pollMs, enabled])

  return { count, loading, error, refresh }
}
