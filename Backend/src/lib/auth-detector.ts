import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AuthContext {
  isAuthenticated: boolean
  userId?: string
  userEmail?: string
  userType?: string
}

/**
 * Detecta si la request tiene un usuario autenticado
 *
 * IMPORTANTE: Esta función NO bloquea la request, solo detecta el estado de auth.
 * Es fail-safe: en caso de error, retorna isAuthenticated: false
 *
 * @param req - NextRequest object
 * @returns AuthContext con información del usuario (si está autenticado)
 *
 * @example
 * ```typescript
 * const authContext = await detectAuth(request)
 * if (authContext.isAuthenticated) {
 *   // Usuario logueado: datos completos
 *   return fullData
 * } else {
 *   // Usuario anónimo: datos limitados
 *   return limitedData
 * }
 * ```
 */
export async function detectAuth(req: NextRequest): Promise<AuthContext> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    // Si hay error o no hay usuario, retornar no autenticado
    if (error || !user) {
      return { isAuthenticated: false }
    }

    // Usuario autenticado: extraer info relevante
    return {
      isAuthenticated: true,
      userId: user.id,
      userEmail: user.email,
      userType: user.user_metadata?.userType || user.user_metadata?.user_type
    }
  } catch (error) {
    // Fail-safe: cualquier error, asumir no autenticado
    console.error('[auth-detector] Error detecting auth:', error)
    return { isAuthenticated: false }
  }
}

/**
 * Verifica si el feature flag de listado público está activado
 *
 * @returns boolean indicando si el listado público está habilitado
 */
export function isPublicListingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PUBLIC_LISTING === 'true'
}
