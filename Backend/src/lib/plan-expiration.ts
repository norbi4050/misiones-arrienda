/**
 * Sistema de Auto-Expiración de Planes
 *
 * Este módulo maneja la expiración automática de planes y la
 * desactivación/reactivación de propiedades según los límites del plan.
 */

import { createClient } from '@/lib/supabase/server'

export interface PlanExpirationResult {
  success: boolean
  old_plan: string | null
  new_plan: string | null
  properties_deactivated: number
  message: string
}

/**
 * Verifica si el plan del usuario ha expirado y lo actualiza automáticamente
 *
 * @param userId - UUID del usuario
 * @returns Resultado de la operación de expiración
 */
export async function checkAndExpirePlan(userId: string): Promise<PlanExpirationResult> {
  const supabase = createClient()

  try {
    // Llamar a la función PostgreSQL que maneja toda la lógica
    const { data, error } = await supabase
      .rpc('expire_user_plan', { user_uuid: userId })
      .single<PlanExpirationResult>()

    if (error) {
      console.error('[Plan Expiration] Error calling expire_user_plan:', error)
      return {
        success: false,
        old_plan: null,
        new_plan: null,
        properties_deactivated: 0,
        message: `Error: ${error.message}`
      }
    }

    // Log si hubo cambios
    if (data && data.old_plan !== data.new_plan) {
      console.log(`[Plan Expiration] User ${userId}: ${data.old_plan} → ${data.new_plan}`)
      console.log(`[Plan Expiration] Properties deactivated: ${data.properties_deactivated}`)
    }

    return data || {
      success: false,
      old_plan: null,
      new_plan: null,
      properties_deactivated: 0,
      message: 'No data returned'
    }
  } catch (err) {
    console.error('[Plan Expiration] Unexpected error:', err)
    return {
      success: false,
      old_plan: null,
      new_plan: null,
      properties_deactivated: 0,
      message: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Reactiva propiedades cuando un usuario mejora su plan
 *
 * @param userId - UUID del usuario
 * @param newMaxProperties - Nuevo límite de propiedades activas
 * @returns Número de propiedades reactivadas
 */
export async function reactivatePropertiesOnUpgrade(
  userId: string,
  newMaxProperties: number
): Promise<number> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .rpc('reactivate_properties_on_upgrade', {
        user_uuid: userId,
        new_max_properties: newMaxProperties
      })

    if (error) {
      console.error('[Plan Upgrade] Error reactivating properties:', error)
      return 0
    }

    const reactivated = data || 0

    if (reactivated > 0) {
      console.log(`[Plan Upgrade] User ${userId}: ${reactivated} properties reactivated`)
    }

    return reactivated
  } catch (err) {
    console.error('[Plan Upgrade] Unexpected error:', err)
    return 0
  }
}

/**
 * Desactiva propiedades que excedan el límite del plan actual
 *
 * @param userId - UUID del usuario
 * @param maxAllowed - Número máximo permitido de propiedades activas
 * @returns Número de propiedades desactivadas
 */
export async function deactivateExcessProperties(
  userId: string,
  maxAllowed: number
): Promise<number> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .rpc('deactivate_excess_properties', {
        user_uuid: userId,
        max_allowed: maxAllowed
      })

    if (error) {
      console.error('[Plan Limit] Error deactivating properties:', error)
      return 0
    }

    const deactivated = data || 0

    if (deactivated > 0) {
      console.log(`[Plan Limit] User ${userId}: ${deactivated} properties deactivated`)
    }

    return deactivated
  } catch (err) {
    console.error('[Plan Limit] Unexpected error:', err)
    return 0
  }
}

/**
 * Verifica el plan del usuario al cargar la aplicación
 * Debe llamarse en middleware o en páginas protegidas
 *
 * @param userId - UUID del usuario
 */
export async function verifyPlanOnPageLoad(userId: string): Promise<void> {
  // Ejecutar verificación de forma asíncrona sin bloquear
  checkAndExpirePlan(userId).catch(err => {
    console.error('[Plan Check] Failed to check plan expiration:', err)
  })
}
