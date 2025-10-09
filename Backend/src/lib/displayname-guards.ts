/**
 * PROMPT D1: DisplayName Guards
 * ============================================================================
 * Garantiza que todo usuario tenga un displayName válido sin UUIDs visibles
 * 
 * Reglas aplicadas:
 * 1. Si name está vacío/whitespace o es UUID → usar localPart(email)
 * 2. Si name > 80 chars → truncar respetando palabras
 * 3. Trim y normalización de espacios múltiples
 * 4. Nunca sobrescribir name válido existente
 * 5. Logging con tag [DisplayNameGuard]
 * 
 * Compatibilidad:
 * - NO toca UserProfile.companyName
 * - NO toca UserProfile.full_name
 * - Solo trabaja con users.name (Supabase schema)
 * 
 * Feature Flag:
 * - DISPLAYNAME_GUARD_ENABLED (default: true)
 * - Si está en false → solo loggea el skip, no modifica datos
 * ============================================================================
 */

import { isUUID } from '@/lib/utils/validation';

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_NAME_LENGTH = 80;
const GUARDS_ENABLED = process.env.DISPLAYNAME_GUARD_ENABLED !== 'false';

// ============================================================================
// TIPOS
// ============================================================================

export type DisplayNameSource = 
  | 'original'        // Se mantuvo el name original
  | 'emailFallback'   // Se usó localPart del email
  | 'truncated'       // Se truncó por longitud
  | 'normalized';     // Solo se normalizaron espacios

export interface DisplayNameGuardResult {
  name: string;
  source: DisplayNameSource;
  wasModified: boolean;
  reason?: string;
}

export interface AvatarCleanResult {
  avatar: string | null;
  wasModified: boolean;
  reason?: string;
}

// ============================================================================
// HELPERS PRIVADOS
// ============================================================================

/**
 * Extrae la parte local del email (antes del @)
 * Ejemplo: "usuario@example.com" → "usuario"
 */
function getEmailLocalPart(email: string): string {
  const parts = email.split('@');
  return parts[0] || 'usuario';
}

/**
 * Trunca un nombre respetando palabras completas
 * Ejemplo: "Juan Carlos Rodriguez Martinez" (35 chars) → "Juan Carlos Rodriguez" (21 chars)
 */
function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;
  
  const truncated = name.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Si hay un espacio, cortar ahí para respetar palabras
  // Si no hay espacios, cortar en maxLength
  return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
}

/**
 * Normaliza espacios múltiples y trim
 * Ejemplo: "  Juan   Carlos  " → "Juan Carlos"
 */
function normalizeSpaces(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

/**
 * PROMPT D1: Aplica todas las guardas de displayName
 * 
 * @param name - Nombre a validar/corregir
 * @param email - Email del usuario (para fallback)
 * @param existingName - Nombre existente en DB (opcional, para no sobrescribir)
 * @returns Objeto con name procesado, source y metadata
 * 
 * @example
 * // Caso 1: Name vacío
 * applyDisplayNameGuards('', 'juan@example.com')
 * // → { name: 'juan', source: 'emailFallback', wasModified: true }
 * 
 * // Caso 2: Name es UUID
 * applyDisplayNameGuards('550e8400-e29b-41d4-a716-446655440000', 'maria@example.com')
 * // → { name: 'maria', source: 'emailFallback', wasModified: true }
 * 
 * // Caso 3: Name muy largo
 * applyDisplayNameGuards('Juan Carlos Rodriguez Martinez Gonzalez Lopez Fernandez Perez', 'juan@example.com')
 * // → { name: 'Juan Carlos Rodriguez Martinez Gonzalez Lopez Fernandez', source: 'truncated', wasModified: true }
 * 
 * // Caso 4: Name válido existente (no sobrescribir)
 * applyDisplayNameGuards('Nuevo Nombre', 'juan@example.com', 'Juan Existente')
 * // → { name: 'Juan Existente', source: 'original', wasModified: false }
 */
export function applyDisplayNameGuards(
  name: string | null | undefined,
  email: string,
  existingName?: string | null
): DisplayNameGuardResult {
  // ========================================
  // FEATURE FLAG CHECK
  // ========================================
  if (!GUARDS_ENABLED) {
    console.log('[DisplayNameGuard] SKIPPED (feature flag disabled)');
    return {
      name: name || getEmailLocalPart(email),
      source: 'original',
      wasModified: false
    };
  }

  // ========================================
  // REGLA 4: No sobrescribir name válido existente
  // ========================================
  if (existingName && existingName.trim() && !isUUID(existingName)) {
    console.log(`[DisplayNameGuard] Keeping existing valid name: "${existingName}"`);
    return {
      name: existingName,
      source: 'original',
      wasModified: false
    };
  }

  let processedName = name || '';
  let source: DisplayNameSource = 'original';
  let reason: string | undefined;

  // ========================================
  // REGLA 1: Si está vacío o es UUID → usar email
  // ========================================
  const trimmedName = processedName.trim();
  
  if (!trimmedName || isUUID(trimmedName)) {
    const emailLocal = getEmailLocalPart(email);
    processedName = emailLocal;
    source = 'emailFallback';
    
    if (isUUID(trimmedName)) {
      reason = `UUID detected: "${trimmedName.substring(0, 36)}"`;
    } else {
      reason = 'Empty or whitespace name';
    }
    
    console.log(`[DisplayNameGuard] Applied fallback: ${reason} → "${processedName}"`);
  } else {
    processedName = trimmedName;
  }

  // ========================================
  // REGLA 3: Normalizar espacios
  // ========================================
  const beforeNormalization = processedName;
  processedName = normalizeSpaces(processedName);
  
  if (processedName !== beforeNormalization) {
    source = 'normalized';
    console.log(`[DisplayNameGuard] Normalized spaces: "${beforeNormalization}" → "${processedName}"`);
  }

  // ========================================
  // REGLA 2: Truncar si es muy largo
  // ========================================
  if (processedName.length > MAX_NAME_LENGTH) {
    const originalLength = processedName.length;
    processedName = truncateName(processedName, MAX_NAME_LENGTH);
    source = 'truncated';
    reason = `Truncated from ${originalLength} to ${processedName.length} chars`;
    
    console.log(`[DisplayNameGuard] ${reason}: "${processedName}"`);
  }

  // ========================================
  // RESULTADO FINAL
  // ========================================
  const wasModified = processedName !== (name || '');

  if (wasModified) {
    console.log(`[DisplayNameGuard] FINAL: name="${name}" → "${processedName}" (source: ${source})`);
  }

  return {
    name: processedName,
    source,
    wasModified,
    reason
  };
}

/**
 * PROMPT D1: Valida y limpia avatar URL
 * 
 * Detecta y elimina avatares inválidos:
 * - Cadenas vacías
 * - Data URIs vacíos (data:, o data:;)
 * - URLs con 404 o not-found
 * - URLs localhost o 127.0.0.1
 * - UUIDs como avatar
 * 
 * @param avatar - URL del avatar a validar
 * @returns Objeto con avatar limpio (o null) y metadata
 * 
 * @example
 * // Caso 1: Avatar vacío
 * cleanAvatarUrl('')
 * // → { avatar: null, wasModified: true, reason: 'Empty string' }
 * 
 * // Caso 2: Data URI inválido
 * cleanAvatarUrl('data:,')
 * // → { avatar: null, wasModified: true, reason: 'Invalid data URI' }
 * 
 * // Caso 3: Avatar válido
 * cleanAvatarUrl('https://example.com/avatar.jpg')
 * // → { avatar: 'https://example.com/avatar.jpg', wasModified: false }
 */
export function cleanAvatarUrl(avatar: string | null | undefined): AvatarCleanResult {
  // Si es null o undefined, retornar null
  if (avatar === null || avatar === undefined) {
    return {
      avatar: null,
      wasModified: false
    };
  }

  const trimmed = avatar.trim();

  // Si está vacío después de trim
  if (!trimmed) {
    console.log('[DisplayNameGuard] Avatar is empty string');
    return {
      avatar: null,
      wasModified: true,
      reason: 'Empty string'
    };
  }

  // Patrones inválidos
  const invalidPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^data:,/, name: 'Invalid data URI (data:,)' },
    { pattern: /^data:;/, name: 'Invalid data URI (data:;)' },
    { pattern: /404/, name: 'Contains 404' },
    { pattern: /not-found/i, name: 'Contains not-found' },
    { pattern: /localhost/, name: 'Localhost URL' },
    { pattern: /127\.0\.0\.1/, name: '127.0.0.1 URL' },
    { pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, name: 'UUID as avatar' }
  ];

  for (const { pattern, name: patternName } of invalidPatterns) {
    if (pattern.test(trimmed)) {
      const preview = trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed;
      console.log(`[DisplayNameGuard] Invalid avatar detected (${patternName}): ${preview}`);
      
      return {
        avatar: null,
        wasModified: true,
        reason: patternName
      };
    }
  }

  // Avatar válido
  return {
    avatar: trimmed,
    wasModified: false
  };
}

/**
 * PROMPT D1: Aplica guardas completas (name + avatar)
 * 
 * Función de conveniencia que aplica ambas guardas en una sola llamada
 * 
 * @param data - Datos del usuario a procesar
 * @returns Objeto con name y avatar procesados
 * 
 * @example
 * const result = applyAllGuards({
 *   name: '',
 *   email: 'juan@example.com',
 *   avatar: 'data:,'
 * });
 * // → { name: 'juan', avatar: null, nameSource: 'emailFallback', ... }
 */
export function applyAllGuards(data: {
  name: string | null | undefined;
  email: string;
  avatar?: string | null | undefined;
  existingName?: string | null;
  existingAvatar?: string | null;
}): {
  name: string;
  avatar: string | null;
  nameSource: DisplayNameSource;
  nameWasModified: boolean;
  avatarWasModified: boolean;
  nameReason?: string;
  avatarReason?: string;
} {
  const nameResult = applyDisplayNameGuards(
    data.name,
    data.email,
    data.existingName
  );

  const avatarResult = cleanAvatarUrl(data.avatar);

  return {
    name: nameResult.name,
    avatar: avatarResult.avatar,
    nameSource: nameResult.source,
    nameWasModified: nameResult.wasModified,
    avatarWasModified: avatarResult.wasModified,
    nameReason: nameResult.reason,
    avatarReason: avatarResult.reason
  };
}

/**
 * PROMPT D5: Verifica si las guardas están habilitadas
 * 
 * @returns true si las guardas están activas
 */
export function areGuardsEnabled(): boolean {
  return GUARDS_ENABLED;
}

/**
 * PROMPT D1: Log de guardado con información completa
 * 
 * Loggea información detallada del guardado para auditoría
 * 
 * @param context - Contexto del guardado (registro, edición, etc.)
 * @param result - Resultado de aplicar las guardas
 */
export function logGuardApplication(
  context: 'registration' | 'profile_edit' | 'other',
  result: {
    email: string;
    name: string;
    source: DisplayNameSource;
    wasModified: boolean;
    reason?: string;
  }
): void {
  const tag = '[DisplayNameGuard]';
  const timestamp = new Date().toISOString();
  
  if (result.wasModified) {
    console.log(
      `${tag} ${context.toUpperCase()}: ` +
      `email=${result.email}, ` +
      `name="${result.name}", ` +
      `source=${result.source}, ` +
      `modified=true, ` +
      `reason="${result.reason || 'N/A'}", ` +
      `timestamp=${timestamp}`
    );
  } else {
    console.log(
      `${tag} ${context.toUpperCase()}: ` +
      `email=${result.email}, ` +
      `name="${result.name}", ` +
      `source=${result.source}, ` +
      `modified=false, ` +
      `timestamp=${timestamp}`
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MAX_NAME_LENGTH,
  GUARDS_ENABLED
};
