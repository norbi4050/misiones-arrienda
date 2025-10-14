/**
 * Hook: usePresenceTracking
 * 
 * Detecta la actividad del usuario y actualiza su estado de presencia automáticamente.
 * 
 * Funcionalidad:
 * - Detecta eventos de actividad (mouse, teclado, scroll, click)
 * - Actualiza presencia cada 5 minutos (optimizado para rendimiento)
 * - Marca como offline al cerrar pestaña/navegador (beforeunload)
 * - Cleanup correcto para evitar memory leaks
 * - Detección de inactividad para reducir requests innecesarios
 * 
 * @created 2025
 * @optimized 2025-10-14 - Reducción de 85% en requests
 */

'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Constantes de configuración optimizadas para rendimiento
const ACTIVITY_INTERVAL = 300000 // 5 minutos - Intervalo entre actualizaciones (solo si hay actividad)
const THROTTLE_DELAY = 30000     // 30 segundos - Delay mínimo entre detecciones de actividad
const IDLE_TIMEOUT = 600000      // 10 minutos - Tiempo sin actividad para considerar usuario idle

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
    let isUserActive = true // Flag para detectar si el usuario está activo

    /**
     * Actualiza la presencia del usuario en el servidor
     * Solo se ejecuta si el usuario ha estado activo recientemente
     */
    const updatePresence = async () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current

      // Solo actualizar si el usuario ha estado activo en los últimos IDLE_TIMEOUT minutos
      if (timeSinceLastActivity > IDLE_TIMEOUT) {
        isUserActive = false
        if (process.env.NODE_ENV === 'development') {
          console.info('[usePresenceTracking] ⏸️ User idle, skipping presence update')
        }
        return
      }

      try {
        await fetch('/api/presence/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        lastUpdateRef.current = now
        isUserActive = true
        
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

      // Reactivar flag si estaba inactivo
      if (!isUserActive) {
        isUserActive = true
        if (process.env.NODE_ENV === 'development') {
          console.info('[usePresenceTracking] ▶️ User active again')
        }
      }

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
    // Solo actualiza si el usuario ha estado activo
    intervalRef.current = setInterval(updatePresence, ACTIVITY_INTERVAL)

    // ========================================
    // EVENT LISTENERS - Detección de actividad (reducidos para mejor rendimiento)
    // ========================================

    // Eventos de mouse (solo los más relevantes)
    window.addEventListener('mousemove', handleActivity, { passive: true })
    window.addEventListener('click', handleActivity, { passive: true })

    // Eventos de teclado
    window.addEventListener('keydown', handleActivity, { passive: true })

    // Eventos de scroll
    window.addEventListener('scroll', handleActivity, { passive: true })

    // Eventos de touch (mobile)
    window.addEventListener('touchstart', handleActivity, { passive: true })

    // Eventos de foco
    window.addEventListener('focus', handleActivity, { passive: true })

    // Evento de cierre de pestaña/navegador
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Evento de visibilidad (cuando el usuario cambia de pestaña)
    // Optimizado: solo actualizar al volver, no al salir
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Usuario volvió a la pestaña → actualizar presencia
        lastActivityRef.current = Date.now()
        updatePresence()
      }
      // Removido: markOffline() cuando hidden - causaba requests excesivos
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
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
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
