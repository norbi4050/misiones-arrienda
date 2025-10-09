// src/lib/account-guards.ts
// Guards y helpers para gestión de estado de cuentas

import { AccountStatus } from '@/types/account'

/**
 * Verifica si una cuenta está suspendida
 */
export function isAccountSuspended(status?: AccountStatus | null): boolean {
  return status === 'suspended'
}

/**
 * Verifica si una cuenta está eliminada
 */
export function isAccountDeleted(status?: AccountStatus | null): boolean {
  return status === 'deleted'
}

/**
 * Verifica si una cuenta está activa
 */
export function isAccountActive(status?: AccountStatus | null): boolean {
  return status === 'active' || !status // Por defecto, si no hay status, se considera activa
}

/**
 * Verifica si el usuario puede realizar acciones (publicar, enviar mensajes, etc.)
 */
export function canPerformActions(status?: AccountStatus | null): boolean {
  return isAccountActive(status)
}

/**
 * Obtiene el mensaje de estado para mostrar al usuario
 */
export function getAccountStatusMessage(status?: AccountStatus | null): string | null {
  if (isAccountSuspended(status)) {
    return 'Tu cuenta está suspendida. No puedes publicar ni enviar mensajes.'
  }
  
  if (isAccountDeleted(status)) {
    return 'Tu cuenta ha sido eliminada.'
  }
  
  return null
}

/**
 * Obtiene el color del badge de estado
 */
export function getAccountStatusColor(status?: AccountStatus | null): 'green' | 'yellow' | 'red' {
  if (isAccountActive(status)) return 'green'
  if (isAccountSuspended(status)) return 'yellow'
  return 'red'
}

/**
 * Obtiene el texto del badge de estado
 */
export function getAccountStatusLabel(status?: AccountStatus | null): string {
  if (isAccountActive(status)) return 'Activa'
  if (isAccountSuspended(status)) return 'Suspendida'
  if (isAccountDeleted(status)) return 'Eliminada'
  return 'Desconocido'
}

/**
 * Log de aplicación de guard (para debugging)
 */
export function logAccountGuard(
  action: string,
  status: AccountStatus | null | undefined,
  allowed: boolean
) {
  console.log('[AccountGuard]', {
    action,
    status: status || 'unknown',
    allowed,
    timestamp: new Date().toISOString()
  })
}
