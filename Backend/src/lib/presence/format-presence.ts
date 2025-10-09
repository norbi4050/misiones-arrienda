/**
 * Helper: format-presence
 * 
 * Funciones utilitarias para formatear información de presencia de usuarios
 * de manera consistente en toda la aplicación.
 * 
 * @created 2025
 */

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Interfaz de presencia de usuario
 */
export interface UserPresence {
  isOnline: boolean
  lastSeen: string | null
  lastActivity: string
}

/**
 * Obtiene el texto de presencia formateado
 * 
 * @param presence - Datos de presencia del usuario
 * @returns Texto formateado ("En línea", "Últ. vez hace X", "Desconectado") o null si no hay datos
 * 
 * @example
 * ```ts
 * const text = getPresenceText({ isOnline: true, lastSeen: null, lastActivity: '2025-01-15T10:00:00Z' })
 * // Returns: "En línea"
 * 
 * const text2 = getPresenceText({ isOnline: false, lastSeen: '2025-01-15T08:00:00Z', lastActivity: '2025-01-15T08:00:00Z' })
 * // Returns: "Últ. vez hace 2 horas"
 * ```
 */
export function getPresenceText(presence?: UserPresence | null): string | null {
  if (!presence) {
    return null
  }
  
  // Usuario está online
  if (presence.isOnline) {
    return 'En línea'
  }
  
  // Usuario está offline - mostrar última conexión
  if (presence.lastSeen) {
    try {
      const lastSeenDate = new Date(presence.lastSeen)
      return `Últ. vez ${formatDistanceToNow(lastSeenDate, { 
        addSuffix: true,
        locale: es 
      })}`
    } catch (error) {
      console.error('[format-presence] Error formatting lastSeen:', error)
      return 'Desconectado'
    }
  }
  
  return 'Desconectado'
}

/**
 * Obtiene el color del texto de presencia
 * 
 * @param isOnline - Si el usuario está online
 * @returns Clase de color de Tailwind
 * 
 * @example
 * ```ts
 * const color = getPresenceColor(true)
 * // Returns: "text-green-600"
 * 
 * const color2 = getPresenceColor(false)
 * // Returns: "text-gray-500"
 * ```
 */
export function getPresenceColor(isOnline: boolean): string {
  return isOnline ? 'text-green-600' : 'text-gray-500'
}

/**
 * Obtiene las clases CSS para el badge de presencia
 * 
 * @param isOnline - Si el usuario está online
 * @returns Clases de Tailwind para el badge
 * 
 * @example
 * ```ts
 * const classes = getPresenceBadgeClass(true)
 * // Returns: "bg-green-500"
 * 
 * const classes2 = getPresenceBadgeClass(false)
 * // Returns: "bg-gray-400"
 * ```
 */
export function getPresenceBadgeClass(isOnline: boolean): string {
  return isOnline ? 'bg-green-500' : 'bg-gray-400'
}

/**
 * Obtiene el título/tooltip para el badge de presencia
 * 
 * @param isOnline - Si el usuario está online
 * @returns Texto para el atributo title
 * 
 * @example
 * ```ts
 * const title = getPresenceBadgeTitle(true)
 * // Returns: "En línea"
 * 
 * const title2 = getPresenceBadgeTitle(false)
 * // Returns: "Desconectado"
 * ```
 */
export function getPresenceBadgeTitle(isOnline: boolean): string {
  return isOnline ? 'En línea' : 'Desconectado'
}

/**
 * Obtiene el aria-label para accesibilidad del badge de presencia
 * 
 * @param isOnline - Si el usuario está online
 * @returns Texto para aria-label
 * 
 * @example
 * ```ts
 * const label = getPresenceBadgeAriaLabel(true)
 * // Returns: "Usuario en línea"
 * 
 * const label2 = getPresenceBadgeAriaLabel(false)
 * // Returns: "Usuario desconectado"
 * ```
 */
export function getPresenceBadgeAriaLabel(isOnline: boolean): string {
  return isOnline ? 'Usuario en línea' : 'Usuario desconectado'
}

/**
 * Verifica si los datos de presencia son válidos
 * 
 * @param presence - Datos de presencia a validar
 * @returns true si los datos son válidos
 * 
 * @example
 * ```ts
 * const isValid = isValidPresence({ isOnline: true, lastSeen: null, lastActivity: '2025-01-15T10:00:00Z' })
 * // Returns: true
 * 
 * const isValid2 = isValidPresence(null)
 * // Returns: false
 * ```
 */
export function isValidPresence(presence?: UserPresence | null): presence is UserPresence {
  if (!presence) return false
  
  return (
    typeof presence.isOnline === 'boolean' &&
    typeof presence.lastActivity === 'string' &&
    (presence.lastSeen === null || typeof presence.lastSeen === 'string')
  )
}
