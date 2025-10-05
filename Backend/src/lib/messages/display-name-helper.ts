/**
 * Helper para calcular displayName con lógica de prioridad
 * 
 * Prioridad:
 * 1. User.name (si existe y no está vacío)
 * 2. UserProfile.companyName (para empresas/inmobiliarias - GANA a full_name)
 * 3. UserProfile.full_name (para individuos)
 * 4. Parte local del email (antes del @)
 * 5. Fallback: "Usuario"
 * 
 * PROMPT D1 & D2: Retorna objeto con displayName y source para trazabilidad
 */

interface UserData {
  name?: string | null
  email?: string | null
}

interface UserProfileData {
  full_name?: string | null
  companyName?: string | null
  company_name?: string | null // snake_case variant
}

export type DisplayNameSource = 
  | 'User.name' 
  | 'UserProfile.companyName' 
  | 'UserProfile.full_name' 
  | 'emailLocal' 
  | 'fallback'

export interface DisplayNameResult {
  displayName: string
  source: DisplayNameSource
}

/**
 * PROMPT D2: Detecta si un string es un UUID
 */
export function isUUID(str: string | null | undefined): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * PROMPT D1 & D2: Versión extendida que retorna { displayName, source }
 */
export function getDisplayNameWithSource(
  userData: UserData | null,
  userProfileData: UserProfileData | null
): DisplayNameResult {
  // Prioridad 1: User.name (si existe, no está vacío, y NO es UUID)
  if (userData?.name && userData.name.trim() && !isUUID(userData.name)) {
    return {
      displayName: userData.name.trim(),
      source: 'User.name'
    }
  }

  // Prioridad 2: UserProfile.companyName (para empresas/inmobiliarias)
  // PROMPT D2: companyName GANA a full_name cuando ambos existen
  if (userProfileData) {
    const companyName = userProfileData.companyName || userProfileData.company_name
    if (companyName && companyName.trim() && !isUUID(companyName)) {
      return {
        displayName: companyName.trim(),
        source: 'UserProfile.companyName'
      }
    }
    
    // Prioridad 3: UserProfile.full_name (para individuos)
    const fullName = userProfileData.full_name
    if (fullName && fullName.trim() && !isUUID(fullName)) {
      return {
        displayName: fullName.trim(),
        source: 'UserProfile.full_name'
      }
    }
  }

  // Prioridad 4: Parte local del email
  if (userData?.email) {
    const emailLocal = userData.email.split('@')[0]
    if (emailLocal && emailLocal.trim() && !isUUID(emailLocal)) {
      return {
        displayName: emailLocal.trim(),
        source: 'emailLocal'
      }
    }
  }

  // Prioridad 5: Fallback
  return {
    displayName: 'Usuario',
    source: 'fallback'
  }
}

/**
 * PROMPT D1 & D2: Versión backward-compatible que solo retorna el string
 * Mantiene compatibilidad con código existente
 */
export function getDisplayName(
  userData: UserData | null,
  userProfileData: UserProfileData | null
): string {
  const result = getDisplayNameWithSource(userData, userProfileData)
  return result.displayName
}

/**
 * Extrae la parte local del email (antes del @)
 */
export function getEmailLocalPart(email: string | null | undefined): string {
  if (!email) return 'Usuario'
  const parts = email.split('@')
  return parts[0] || 'Usuario'
}

/**
 * Valida que displayName nunca sea undefined o vacío
 */
export function ensureDisplayName(displayName: string | null | undefined): string {
  if (!displayName || !displayName.trim()) {
    return 'Usuario'
  }
  return displayName.trim()
}
