/**
 * 🔐 SISTEMA DE AUTENTICACIÓN DE ADMINISTRADORES
 *
 * Sistema discreto de permisos de admin basado en whitelist de emails.
 * Los usuarios no ven ninguna diferencia en la UI.
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Lista de emails con permisos de administrador
 * IMPORTANTE: Mantener esta lista actualizada en variables de entorno
 */
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []

/**
 * Email de super admin (siempre tiene acceso)
 * Este es tu email personal que SIEMPRE tendrá acceso
 */
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.toLowerCase() || ''

/**
 * Verifica si un email tiene permisos de administrador
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false

  const normalizedEmail = email.toLowerCase().trim()

  // Super admin siempre tiene acceso
  if (SUPER_ADMIN_EMAIL && normalizedEmail === SUPER_ADMIN_EMAIL) {
    return true
  }

  // Verificar en lista de admins
  return ADMIN_EMAILS.includes(normalizedEmail)
}

/**
 * Verifica si el usuario autenticado actual es administrador
 * Uso en Server Components y API Routes
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || !user.email) {
      return false
    }

    return isAdminEmail(user.email)
  } catch (error) {
    console.error('[AdminAuth] Error checking admin status:', error)
    return false
  }
}

/**
 * Obtiene información del usuario admin actual
 */
export async function getCurrentAdminUser() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const isAdmin = isAdminEmail(user.email)

    if (!isAdmin) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      isSuperAdmin: user.email?.toLowerCase() === SUPER_ADMIN_EMAIL
    }
  } catch (error) {
    console.error('[AdminAuth] Error getting admin user:', error)
    return null
  }
}

/**
 * Hook para verificar permisos de admin (Client Components)
 * Retorna objeto con estado de carga y si es admin
 */
export interface UseAdminResult {
  isAdmin: boolean
  isLoading: boolean
  adminUser: {
    id: string
    email: string
    name: string
    isSuperAdmin: boolean
  } | null
}

/**
 * Respuesta estándar para acceso denegado
 */
export const ADMIN_ACCESS_DENIED = {
  error: 'Acceso denegado',
  message: 'No tienes permisos para acceder a esta sección',
  code: 'ADMIN_ACCESS_DENIED'
}

/**
 * Lista de rutas que requieren permisos de administrador
 */
export const ADMIN_PROTECTED_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/users',
  '/admin/properties',
  '/admin/reports',
  '/admin/analytics',
  '/admin/kpis',
  '/api/admin'
]

/**
 * Verifica si una ruta requiere permisos de admin
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Logging de accesos admin para auditoría
 */
export async function logAdminAccess(action: string, details?: Record<string, any>) {
  try {
    const adminUser = await getCurrentAdminUser()

    if (!adminUser) return

    console.log('[AdminAudit]', {
      timestamp: new Date().toISOString(),
      admin_email: adminUser.email,
      admin_id: adminUser.id,
      action,
      details,
      is_super_admin: adminUser.isSuperAdmin
    })

    // TODO: Guardar en tabla de auditoría si se requiere
  } catch (error) {
    console.error('[AdminAudit] Error logging access:', error)
  }
}
