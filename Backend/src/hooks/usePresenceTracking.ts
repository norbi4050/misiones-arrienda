/**
 * Hook: usePresenceTracking
 * 
 * Detecta la actividad del usuario y actualiza su estado de presencia automáticamente.
 * 
 * Funcionalidad:
 * - Detecta eventos de actividad (mouse, teclado, scroll, click)
 * - Actualiza presencia cada 60 segundos (throttling)
 * - Marca como offline al cerrar pestaña/navegador (beforeunload)
 * - Cleanup correcto para evitar memory leaks
 * 
 * @created 2025
 */

'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Constantes de configuración
const ACTIVITY_INTERVAL = 60000 // 60 segundos - Intervalo entre actualizaciones
const THROTTLE_DELAY = 5000     // 5 segundos - Delay mínimo entre detecciones de actividad

/**
 * Hook para tracking automático de presencia del usuario
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePresenceTracking()
 *   return <div>...</div>
 * }
 * ```
 */
export function usePresenceTracking() {
  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(Date.now())
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    // Solo ejecutar si hay usuario autenticado
    if (!user?.id) {
      return
    }

    const userId = user.id

    /**
     * Actualiza la presencia del usuario en el servidor
     */
    const updatePresence = async () => {
      try {
        await fetch('/api/presence/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        lastUpdateRef.current = Date.now()
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[usePresenceTracking] ✅ Presence updated for user:', userId)
        }
      } catch (error) {
        console.error('[usePresenceTracking] Error updating presence:', error)
      }
    }

    /**
     * Marca al usuario como offline
     */
    const markOffline = async () => {
      try {
        await fetch('/api/presence/offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
          keepalive: true // Importante: permite que la request se complete aunque se cierre la página
        })
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[usePresenceTracking] ✅ User marked as offline:', userId)
        }
      } catch (error) {
        console.error('[usePresenceTracking] Error marking offline:', error)
      }
    }

    /**
     * Handler para eventos de actividad del usuario
     * Implementa throttling para evitar actualizaciones excesivas
     */
    const handleActivity = () => {
      const now = Date.now()
      lastActivityRef.current = now

      // Throttling: solo actualizar si han pasado más de THROTTLE_DELAY desde la última actualización
      if (now - lastUpdateRef.current > THROTTLE_DELAY) {
        updatePresence()
      }
    }

    /**
     * Handler para beforeunload (cierre de pestaña/navegador)
     */
    const handleBeforeUnload = () => {
      markOffline()
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    // Actualizar presencia inmediatamente al montar
    updatePresence()

    // Configurar intervalo para actualizaciones periódicas
    intervalRef.current = setInterval(updatePresence, ACTIVITY_INTERVAL)

    // ========================================
    // EVENT LISTENERS - Detección de actividad
    // ========================================

    // Eventos de mouse
    window.addEventListener('mousemove', handleActivity, { passive: true })
    window.addEventListener('mousedown', handleActivity, { passive: true })
    window.addEventListener('click', handleActivity, { passive: true })

    // Eventos de teclado
    window.addEventListener('keydown', handleActivity, { passive: true })
    window.addEventListener('keypress', handleActivity, { passive: true })

    // Eventos de scroll
    window.addEventListener('scroll', handleActivity, { passive: true })

    // Eventos de touch (mobile)
    window.addEventListener('touchstart', handleActivity, { passive: true })
    window.addEventListener('touchmove', handleActivity, { passive: true })

    // Eventos de foco
    window.addEventListener('focus', handleActivity, { passive: true })

    // Evento de cierre de pestaña/navegador
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Evento de visibilidad (cuando el usuario cambia de pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Usuario volvió a la pestaña → actualizar presencia
        updatePresence()
      } else if (document.visibilityState === 'hidden') {
        // Usuario salió de la pestaña → marcar como offline
        markOffline()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      // Limpiar intervalo
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Remover event listeners
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('touchmove', handleActivity)
      window.removeEventListener('focus', handleActivity)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // Marcar como offline al desmontar
      markOffline()
    }
  }, [user?.id]) // Re-ejecutar si cambia el usuario

  // Este hook no retorna nada, solo ejecuta side effects
  return null
}
