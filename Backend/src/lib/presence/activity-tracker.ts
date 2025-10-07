/**
 * Sistema de Tracking de Presencia de Usuarios
 * 
 * Este módulo maneja la actualización del estado online/offline de los usuarios
 * y sincroniza la información entre las tablas User y UserProfile.
 * 
 * @module presence/activity-tracker
 * @created 2025
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Información de presencia de un usuario
 */
export interface UserPresence {
  isOnline: boolean
  lastSeen: string | null
  lastActivity: string
}

/**
 * Actualiza la actividad del usuario y lo marca como online
 * 
 * Esta función actualiza AMBAS tablas (User y UserProfile) simultáneamente
 * para mantener la sincronización de datos.
 * 
 * @param userId - ID del usuario a actualizar
 * @returns Promise<void>
 * 
 * @example
 * ```ts
 * await updateUserActivity('user-123')
 * ```
 */
export async function updateUserActivity(userId: string): Promise<void> {
  if (!userId) {
    console.error('[activity-tracker] updateUserActivity: userId is required')
    return
  }

  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    // Actualizar en tabla User
    const { error: userError } = await supabase
      .from('User')
      .update({
        is_online: true,
        last_activity: now,
        last_seen: now
      })
      .eq('id', userId)

    if (userError) {
      console.error('[activity-tracker] Error updating User:', userError)
    }

    // Actualizar en tabla UserProfile (si existe)
    // Usamos upsert para crear el registro si no existe
    const { error: profileError } = await supabase
      .from('UserProfile')
      .update({
        is_online: true,
        last_activity: now,
        last_seen: now
      })
      .eq('userId', userId)

    if (profileError) {
      // No es crítico si falla, el usuario puede no tener perfil de comunidad
      console.warn('[activity-tracker] UserProfile update skipped:', profileError.message)
    }

    if (process.env.NODE_ENV === 'development') {
      console.info(`[activity-tracker] ✅ User ${userId} marked as online`)
    }
  } catch (error) {
    console.error('[activity-tracker] Unexpected error in updateUserActivity:', error)
  }
}

/**
 * Marca al usuario como offline
 * 
 * Actualiza el estado en AMBAS tablas (User y UserProfile) y registra
 * el timestamp de última conexión.
 * 
 * @param userId - ID del usuario a marcar como offline
 * @returns Promise<void>
 * 
 * @example
 * ```ts
 * await markUserOffline('user-123')
 * ```
 */
export async function markUserOffline(userId: string): Promise<void> {
  if (!userId) {
    console.error('[activity-tracker] markUserOffline: userId is required')
    return
  }

  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    // Actualizar en tabla User
    const { error: userError } = await supabase
      .from('User')
      .update({
        is_online: false,
        last_seen: now
      })
      .eq('id', userId)

    if (userError) {
      console.error('[activity-tracker] Error updating User offline:', userError)
    }

    // Actualizar en tabla UserProfile (si existe)
    const { error: profileError } = await supabase
      .from('UserProfile')
      .update({
        is_online: false,
        last_seen: now
      })
      .eq('userId', userId)

    if (profileError) {
      // No es crítico si falla
      console.warn('[activity-tracker] UserProfile offline update skipped:', profileError.message)
    }

    if (process.env.NODE_ENV === 'development') {
      console.info(`[activity-tracker] ✅ User ${userId} marked as offline`)
    }
  } catch (error) {
    console.error('[activity-tracker] Unexpected error in markUserOffline:', error)
  }
}

/**
 * Obtiene el estado de presencia actual de un usuario
 * 
 * Consulta la tabla User para obtener la información de presencia.
 * Retorna null si el usuario no existe o si hay un error.
 * 
 * @param userId - ID del usuario
 * @returns Promise<UserPresence | null>
 * 
 * @example
 * ```ts
 * const presence = await getUserPresence('user-123')
 * if (presence?.isOnline) {
 *   console.log('Usuario está online')
 * }
 * ```
 */
export async function getUserPresence(userId: string): Promise<UserPresence | null> {
  if (!userId) {
    console.error('[activity-tracker] getUserPresence: userId is required')
    return null
  }

  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('User')
      .select('is_online, last_seen, last_activity')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[activity-tracker] Error fetching user presence:', error)
      return null
    }

    if (!data) {
      console.warn('[activity-tracker] User not found:', userId)
      return null
    }

    return {
      isOnline: data.is_online ?? false,
      lastSeen: data.last_seen,
      lastActivity: data.last_activity ?? new Date().toISOString()
    }
  } catch (error) {
    console.error('[activity-tracker] Unexpected error in getUserPresence:', error)
    return null
  }
}

/**
 * Obtiene el estado de presencia de múltiples usuarios
 * 
 * Útil para obtener presencia de varios usuarios de una vez
 * (por ejemplo, en un listado de conversaciones).
 * 
 * @param userIds - Array de IDs de usuarios
 * @returns Promise<Map<string, UserPresence>>
 * 
 * @example
 * ```ts
 * const presences = await getBulkUserPresence(['user-1', 'user-2'])
 * const user1Presence = presences.get('user-1')
 * ```
 */
export async function getBulkUserPresence(userIds: string[]): Promise<Map<string, UserPresence>> {
  const presenceMap = new Map<string, UserPresence>()

  if (!userIds || userIds.length === 0) {
    return presenceMap
  }

  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('User')
      .select('id, is_online, last_seen, last_activity')
      .in('id', userIds)

    if (error) {
      console.error('[activity-tracker] Error fetching bulk presence:', error)
      return presenceMap
    }

    if (data) {
      data.forEach(user => {
        presenceMap.set(user.id, {
          isOnline: user.is_online ?? false,
          lastSeen: user.last_seen,
          lastActivity: user.last_activity ?? new Date().toISOString()
        })
      })
    }

    return presenceMap
  } catch (error) {
    console.error('[activity-tracker] Unexpected error in getBulkUserPresence:', error)
    return presenceMap
  }
}

/**
 * Verifica si un usuario está actualmente online
 * 
 * Helper rápido para verificar solo el estado online sin obtener
 * toda la información de presencia.
 * 
 * @param userId - ID del usuario
 * @returns Promise<boolean>
 * 
 * @example
 * ```ts
 * const isOnline = await isUserOnline('user-123')
 * ```
 */
export async function isUserOnline(userId: string): Promise<boolean> {
  const presence = await getUserPresence(userId)
  return presence?.isOnline ?? false
}

/**
 * Obtiene el timestamp de última conexión de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Promise<string | null>
 * 
 * @example
 * ```ts
 * const lastSeen = await getLastSeen('user-123')
 * if (lastSeen) {
 *   console.log('Última conexión:', new Date(lastSeen))
 * }
 * ```
 */
export async function getLastSeen(userId: string): Promise<string | null> {
  const presence = await getUserPresence(userId)
  return presence?.lastSeen ?? null
}
