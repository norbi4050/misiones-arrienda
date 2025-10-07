/**
 * Componente: PresenceTracker
 * 
 * Componente invisible que ejecuta el hook usePresenceTracking
 * para mantener actualizado el estado de presencia del usuario.
 * 
 * Este componente debe ser incluido en el layout principal de la aplicación
 * para que funcione en todas las páginas.
 * 
 * @created 2025
 */

'use client'

import { usePresenceTracking } from '@/hooks/usePresenceTracking'

/**
 * Componente que ejecuta el tracking de presencia
 * 
 * No renderiza nada visual, solo ejecuta el hook de tracking.
 * 
 * @example
 * ```tsx
 * // En src/app/layout.tsx
 * <body>
 *   <PresenceTracker />
 *   {children}
 * </body>
 * ```
 */
export function PresenceTracker() {
  // Ejecutar el hook de tracking
  usePresenceTracking()

  // No renderizar nada
  return null
}
