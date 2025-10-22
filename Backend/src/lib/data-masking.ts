/**
 * Utilities para enmascarar datos sensibles
 * Usadas cuando usuarios no autenticados ven propiedades
 */

/**
 * Enmascara un número de teléfono mostrando solo los últimos 4 dígitos
 *
 * @param phone - Número de teléfono completo (ej: "+54 376 4567890")
 * @returns Teléfono enmascarado (ej: "+54 *** *** 7890") o null
 *
 * @example
 * maskPhone("+54 376 4567890") // "+54 *** *** 7890"
 * maskPhone("3764567890") // "*** *** 7890"
 * maskPhone(null) // null
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null

  try {
    // Limpiar el teléfono de caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '')

    if (cleanPhone.length < 4) {
      // Si es muy corto, enmascarar todo
      return '*** ***'
    }

    // Obtener últimos 4 dígitos
    const lastFour = cleanPhone.slice(-4)

    // Si empieza con código de país, preservarlo
    if (phone.startsWith('+54')) {
      return `+54 *** *** ${lastFour}`
    } else if (phone.startsWith('+')) {
      // Otro código de país
      const countryCode = phone.match(/^\+\d+/)?.[0] || '+'
      return `${countryCode} *** *** ${lastFour}`
    }

    // Sin código de país
    return `*** *** ${lastFour}`
  } catch (error) {
    console.error('[data-masking] Error masking phone:', error)
    return '*** ***'
  }
}

/**
 * Enmascara un email mostrando solo el dominio
 *
 * @param email - Email completo (ej: "juan@gmail.com")
 * @returns Email enmascarado (ej: "j***@gmail.com") o null
 *
 * @example
 * maskEmail("juan@gmail.com") // "j***@gmail.com"
 * maskEmail("contact@example.com") // "c***@example.com"
 * maskEmail(null) // null
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null

  try {
    const [localPart, domain] = email.split('@')

    if (!localPart || !domain) {
      return '***@***'
    }

    // Mostrar solo primera letra de la parte local
    const maskedLocal = localPart.length > 0 ? `${localPart[0]}***` : '***'

    return `${maskedLocal}@${domain}`
  } catch (error) {
    console.error('[data-masking] Error masking email:', error)
    return '***@***'
  }
}

/**
 * Limita un array a los primeros N elementos
 *
 * @param array - Array a limitar
 * @param limit - Cantidad máxima de elementos
 * @returns Array limitado
 *
 * @example
 * limitArray([1,2,3,4,5], 3) // [1,2,3]
 * limitArray(null, 3) // []
 */
export function limitArray<T>(
  array: T[] | null | undefined,
  limit: number
): T[] {
  if (!array || !Array.isArray(array)) return []
  return array.slice(0, limit)
}

/**
 * Parsea un campo que puede ser string JSON o array
 * Útil para campos images/amenities que Supabase puede retornar como string
 *
 * @param field - Campo a parsear (string JSON o array)
 * @returns Array parseado o array vacío si falla
 */
export function parseArrayField(
  field: string | any[] | null | undefined
): any[] {
  if (!field) return []

  // Si ya es array, retornar
  if (Array.isArray(field)) return field

  // Si es string, intentar parsear
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}
