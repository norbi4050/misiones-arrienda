/**
 * OnlineDot Component
 * 
 * Indicador visual de presencia online (círculo verde/gris).
 * Compatible con ambos sistemas: Realtime Presence y Legacy DB.
 * 
 * @module components/presence/OnlineDot
 * @created 2025-01-12
 */

'use client'

import { PresenceMap } from '@/lib/realtime/presence'

interface OnlineDotProps {
  userId: string
  presences?: PresenceMap
  className?: string
}

/**
 * Componente que muestra un indicador de presencia online
 * 
 * @param userId - ID del usuario a verificar
 * @param presences - Mapa de presencias de Realtime (opcional)
 * @param className - Clases CSS adicionales (opcional)
 * 
 * @example
 * ```tsx
 * // Con Realtime Presence
 * <OnlineDot userId="user-123" presences={realtimeState} />
 * 
 * // Sin presencias (no muestra nada)
 * <OnlineDot userId="user-123" />
 * ```
 */
export function OnlineDot({ userId, presences, className = '' }: OnlineDotProps) {
  // Si no hay presences, no mostrar nada
  if (!presences) {
    return null
  }

  // Verificar si el usuario está online
  const userPresences = presences[userId]
  const isOnline = userPresences && userPresences.length > 0

  if (!isOnline) {
    return null
  }

  return (
    <div
      className={`w-2 h-2 rounded-full bg-green-500 ${className}`}
      title="En línea"
      aria-label="Usuario en línea"
    />
  )
}

/**
 * Variante con badge absoluto (para colocar sobre avatar)
 */
export function OnlineBadge({ userId, presences, className = '' }: OnlineDotProps) {
  if (!presences) {
    return null
  }

  const userPresences = presences[userId]
  const isOnline = userPresences && userPresences.length > 0

  if (!isOnline) {
    return null
  }

  return (
    <div
      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white ${className}`}
      title="En línea"
      aria-label="Usuario en línea"
    />
  )
}
