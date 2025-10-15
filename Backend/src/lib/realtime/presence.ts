/**
 * Supabase Realtime Presence Module
 * 
 * Sistema de presencia en tiempo real usando Supabase Realtime Presence API.
 * Reemplaza el sistema legacy basado en polling y updates a tablas.
 * 
 * Ventajas:
 * - ✅ Sin writes a base de datos
 * - ✅ Actualización instantánea (< 1 segundo)
 * - ✅ Cleanup automático al desconectar WebSocket
 * - ✅ Escalable (estado en memoria)
 * 
 * @module realtime/presence
 * @created 2025-01-12
 */

'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getBrowserSupabase } from '@/lib/supabase/browser'

/**
 * Tipo para el estado de presencia de un usuario
 */
export interface PresenceState {
  user_id: string
  online_at: string
  [key: string]: any
}

/**
 * Tipo para el mapa de presencias (userId -> PresenceState[])
 */
export type PresenceMap = Record<string, PresenceState[]>

/**
 * Configuración del canal de presencia
 */
interface PresenceChannelConfig {
  channelName: string
  userId: string
  metadata?: Record<string, any>
}

/**
 * Resultado del canal de presencia
 */
interface PresenceChannelResult {
  channel: RealtimeChannel | null
  state: PresenceMap
  isReady: boolean
  unsubscribe: () => void
}

/**
 * Crea y configura un canal de Realtime Presence
 * 
 * @param config - Configuración del canal
 * @returns Objeto con canal, estado y funciones de control
 * 
 * @example
 * ```tsx
 * const { channel, state, isReady } = createPresenceChannel({
 *   channelName: 'presence:conversation-123',
 *   userId: 'user-456',
 *   metadata: { displayName: 'Juan' }
 * })
 * ```
 */
export function createPresenceChannel(
  config: PresenceChannelConfig
): PresenceChannelResult {
  const { channelName, userId, metadata = {} } = config
  const [state, setState] = useState<PresenceMap>({})
  const [isReady, setIsReady] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') {
      return
    }

    const supabase = getBrowserSupabase()

    // Crear canal con configuración de presencia
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId
        }
      }
    })

    channelRef.current = channel

    // Suscribirse al canal
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        setState(newState as PresenceMap)
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[Realtime Presence] State synced:', newState)
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any }) => {
        if (process.env.NODE_ENV === 'development') {
          console.info('[Realtime Presence] User joined:', key, newPresences)
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any }) => {
        if (process.env.NODE_ENV === 'development') {
          console.info('[Realtime Presence] User left:', key, leftPresences)
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Trackear presencia del usuario actual
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata
          })
          
          setIsReady(true)
          
          if (process.env.NODE_ENV === 'development') {
            console.info('[Realtime Presence] Channel subscribed and tracking:', channelName)
          }
        }
      })

    // Event listeners para focus/blur
    const handleFocus = async () => {
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          ...metadata
        })
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[Realtime Presence] User focused - tracking updated')
        }
      }
    }

    const handleBlur = async () => {
      if (channelRef.current) {
        await channelRef.current.untrack()
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[Realtime Presence] User blurred - untracked')
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      
      setIsReady(false)
    }
  }, [channelName, userId, metadata])

  const unsubscribe = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
      setIsReady(false)
    }
  }

  return {
    channel: channelRef.current,
    state,
    isReady,
    unsubscribe
  }
}

/**
 * Hook para usar Realtime Presence en componentes React
 * 
 * @param roomKey - Identificador único del "room" (ej: conversationId, 'global', etc.)
 * @param userId - ID del usuario actual
 * @param metadata - Metadata adicional (opcional)
 * @returns Estado de presencia y funciones de control
 * 
 * @example
 * ```tsx
 * function ChatComponent({ conversationId, userId }) {
 *   const { state, isReady } = useRealtimePresence(
 *     `conversation:${conversationId}`,
 *     userId,
 *     { displayName: 'Juan' }
 *   )
 *   
 *   const otherUserOnline = state[otherUserId]?.length > 0
 *   
 *   return <div>{otherUserOnline ? 'En línea' : 'Desconectado'}</div>
 * }
 * ```
 */
export function useRealtimePresence(
  roomKey: string,
  userId: string,
  metadata?: Record<string, any>
): PresenceChannelResult {
  const [state, setState] = useState<PresenceMap>({})
  const [isReady, setIsReady] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Verificar que estamos en el cliente
  const isClient = typeof window !== 'undefined'

  // Memoizar configuración para evitar recrear canal innecesariamente
  const channelName = useMemo(() => `presence:${roomKey}`, [roomKey])

  useEffect(() => {
    // Solo ejecutar en cliente y si tenemos userId
    if (!isClient || !userId) {
      return
    }

    const supabase = getBrowserSupabase()

    // Crear canal con configuración de presencia
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId
        }
      }
    })

    channelRef.current = channel

    // Suscribirse a eventos de presencia
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        setState(newState as PresenceMap)
        
        if (process.env.NODE_ENV === 'development') {
          console.info(`[useRealtimePresence] State synced for ${roomKey}:`, newState)
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any }) => {
        if (process.env.NODE_ENV === 'development') {
          console.info(`[useRealtimePresence] User joined ${roomKey}:`, key, newPresences)
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any }) => {
        if (process.env.NODE_ENV === 'development') {
          console.info(`[useRealtimePresence] User left ${roomKey}:`, key, leftPresences)
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Trackear presencia del usuario actual
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata
          })
          
          setIsReady(true)
          
          if (process.env.NODE_ENV === 'development') {
            console.info(`[useRealtimePresence] Subscribed and tracking: ${channelName}`)
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[useRealtimePresence] Channel error for ${channelName}`)
          setIsReady(false)
        } else if (status === 'TIMED_OUT') {
          console.warn(`[useRealtimePresence] Channel timed out for ${channelName}`)
          setIsReady(false)
        }
      })

    // Event listeners para focus/blur
    const handleFocus = async () => {
      if (channelRef.current && isReady) {
        await channelRef.current.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          ...metadata
        })
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[useRealtimePresence] User focused - tracking updated')
        }
      }
    }

    const handleBlur = async () => {
      if (channelRef.current && isReady) {
        await channelRef.current.untrack()
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[useRealtimePresence] User blurred - untracked')
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      
      setIsReady(false)
      setState({})
    }
  }, [channelName, userId, metadata, isClient, isReady, roomKey])

  const unsubscribe = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
      setIsReady(false)
      setState({})
    }
  }

  return {
    channel: channelRef.current,
    state,
    isReady,
    unsubscribe
  }
}

/**
 * Helper: Verifica si un usuario está online en el estado de presencia
 * 
 * @param presenceState - Estado de presencia del canal
 * @param userId - ID del usuario a verificar
 * @returns true si el usuario está online
 * 
 * @example
 * ```tsx
 * const isOnline = isUserOnlineInPresence(state, 'user-123')
 * ```
 */
export function isUserOnlineInPresence(
  presenceState: PresenceMap,
  userId: string
): boolean {
  const userPresences = presenceState[userId]
  return userPresences && userPresences.length > 0
}

/**
 * Helper: Obtiene el timestamp de última conexión de un usuario
 * 
 * @param presenceState - Estado de presencia del canal
 * @param userId - ID del usuario
 * @returns Timestamp ISO string o null
 * 
 * @example
 * ```tsx
 * const lastSeen = getLastSeenFromPresence(state, 'user-123')
 * ```
 */
export function getLastSeenFromPresence(
  presenceState: PresenceMap,
  userId: string
): string | null {
  const userPresences = presenceState[userId]
  
  if (!userPresences || userPresences.length === 0) {
    return null
  }
  
  // Obtener el más reciente
  const mostRecent = userPresences[0]
  return mostRecent?.online_at || null
}

/**
 * Helper: Obtiene todos los usuarios online en el canal
 * 
 * @param presenceState - Estado de presencia del canal
 * @returns Array de userIds online
 * 
 * @example
 * ```tsx
 * const onlineUsers = getOnlineUsers(state)
 * console.log(`${onlineUsers.length} usuarios online`)
 * ```
 */
export function getOnlineUsers(presenceState: PresenceMap): string[] {
  return Object.keys(presenceState).filter(userId => {
    const presences = presenceState[userId]
    return presences && presences.length > 0
  })
}
