/**
 * Validación de CUIT (Clave Única de Identificación Tributaria)
 * Formato: XX-XXXXXXXX-X
 * Ejemplo: 20-12345678-9
 */

export interface CUITValidationResult {
  valid: boolean
  error?: string
  formatted?: string
}

/**
 * Valida el formato y dígito verificador de un CUIT argentino
 */
export function validateCUIT(cuit: string): CUITValidationResult {
  if (!cuit || typeof cuit !== 'string') {
    return {
      valid: false,
      error: 'CUIT es requerido'
    }
  }

  // Limpiar el CUIT (quitar guiones y espacios)
  const cleanCuit = cuit.replace(/[-\s]/g, '')

  // Validar longitud
  if (cleanCuit.length !== 11) {
    return {
      valid: false,
      error: 'El CUIT debe tener 11 dígitos'
    }
  }

  // Validar que solo contenga números
  if (!/^\d+$/.test(cleanCuit)) {
    return {
      valid: false,
      error: 'El CUIT solo debe contener números'
    }
  }

  // Validar dígito verificador
  const digits = cleanCuit.split('').map(Number)
  const verifierDigit = digits[10]
  
  // Multiplicadores según algoritmo AFIP
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  
  // Calcular suma
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * multipliers[i]
  }
  
  // Calcular dígito verificador esperado
  const remainder = sum % 11
  let expectedVerifier = 11 - remainder
  
  // Casos especiales
  if (expectedVerifier === 11) expectedVerifier = 0
  if (expectedVerifier === 10) expectedVerifier = 9
  
  // Comparar
  if (verifierDigit !== expectedVerifier) {
    return {
      valid: false,
      error: `Dígito verificador incorrecto. Esperado: ${expectedVerifier}, Recibido: ${verifierDigit}`
    }
  }

  // Formatear CUIT
  const formatted = `${cleanCuit.substring(0, 2)}-${cleanCuit.substring(2, 10)}-${cleanCuit.substring(10)}`

  return {
    valid: true,
    formatted
  }
}

/**
 * Formatea un CUIT a formato estándar XX-XXXXXXXX-X
 */
export function formatCUIT(cuit: string): string {
  if (!cuit) return ''
  
  const cleanCuit = cuit.replace(/[-\s]/g, '')
  
  if (cleanCuit.length !== 11) return cuit
  
  return `${cleanCuit.substring(0, 2)}-${cleanCuit.substring(2, 10)}-${cleanCuit.substring(10)}`
}

/**
 * Limpia un CUIT removiendo guiones y espacios
 */
export function cleanCUIT(cuit: string): string {
  if (!cuit) return ''
  return cuit.replace(/[-\s]/g, '')
}

/**
 * Valida el formato visual del CUIT mientras el usuario escribe
 * Útil para validación en tiempo real en inputs
 */
export function validateCUITFormat(cuit: string): boolean {
  if (!cuit) return true // Permitir vacío
  
  // Permitir formatos parciales mientras escribe
  const cleanCuit = cuit.replace(/[-\s]/g, '')
  
  // Debe ser solo números
  if (!/^\d*$/.test(cleanCuit)) return false
  
  // Máximo 11 dígitos
  if (cleanCuit.length > 11) return false
  
  return true
}

/**
 * Auto-formatea el CUIT mientras el usuario escribe
 * Agrega guiones automáticamente
 */
export function autoFormatCUIT(value: string): string {
  // Limpiar
  const clean = value.replace(/[-\s]/g, '')
  
  // Validar que solo sean números
  if (!/^\d*$/.test(clean)) {
    return value.slice(0, -1) // Remover último carácter inválido
  }
  
  // Limitar a 11 dígitos
  const limited = clean.substring(0, 11)
  
  // Formatear según longitud
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 10) {
    return `${limited.substring(0, 2)}-${limited.substring(2)}`
  } else {
    return `${limited.substring(0, 2)}-${limited.substring(2, 10)}-${limited.substring(10)}`
  }
}
