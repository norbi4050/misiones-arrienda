/**
 * PROMPT D3: Utilidades de validación para el cliente
 * Anti-UUID y validaciones de displayName
 */

/**
 * Detecta si un string es un UUID
 * Usado para evitar mostrar UUIDs en la UI
 */
export function isUUID(str: string | null | undefined): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * PROMPT D3: Sanitiza displayName para garantizar que nunca sea UUID
 * Si es UUID, retorna fallback "Usuario"
 */
export function sanitizeDisplayName(displayName: string | null | undefined): string {
  if (!displayName || !displayName.trim()) {
    return 'Usuario'
  }
  
  const trimmed = displayName.trim()
  
  // Si es UUID, usar fallback
  if (isUUID(trimmed)) {
    return 'Usuario'
  }
  
  return trimmed
}

/**
 * PROMPT D3: Valida que un displayName sea seguro para mostrar
 * Retorna true si es válido (no vacío, no UUID)
 */
export function isValidDisplayName(displayName: string | null | undefined): boolean {
  if (!displayName || !displayName.trim()) {
    return false
  }
  
  return !isUUID(displayName.trim())
}
