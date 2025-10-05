/**
 * PROMPT 3: Normalización consistente de threads
 * 
 * Blindar el cliente ante pequeñas variaciones del API.
 * Mapear campos con fallbacks robustos.
 */

import type { EnrichedThread } from '@/types/messages'

/**
 * Normaliza un thread individual desde el formato del API
 * Maneja variaciones de naming (camelCase vs snake_case)
 */
export function normalizeThread(rawThread: any): EnrichedThread {
  if (!rawThread) {
    throw new Error('rawThread is required')
  }

  // Normalizar otherUser
  const otherUser = {
    id: rawThread.otherUser?.id || rawThread.other_user?.id || '',
    displayName: 
      rawThread.otherUser?.displayName || 
      rawThread.otherUser?.display_name ||
      rawThread.otherUser?.name ||
      rawThread.other_user?.name ||
      'Usuario',
    avatarUrl: 
      rawThread.otherUser?.avatarUrl || 
      rawThread.otherUser?.avatar_url ||
      rawThread.otherUser?.avatar ||
      rawThread.other_user?.avatar ||
      null
  }

  // Normalizar lastMessage
  let lastMessage = null
  const rawLastMessage = rawThread.lastMessage || rawThread.last_message

  if (rawLastMessage) {
    lastMessage = {
      id: rawLastMessage.id || '',
      content: rawLastMessage.content || rawLastMessage.body || '',
      createdAt: 
        rawLastMessage.createdAt || 
        rawLastMessage.created_at || 
        new Date().toISOString(),
      senderId: 
        rawLastMessage.senderId || 
        rawLastMessage.sender_id || 
        '',
      isMine: Boolean(rawLastMessage.isMine || rawLastMessage.is_mine)
    }
  }

  // Normalizar property
  let property = null
  const rawProperty = rawThread.property

  if (rawProperty) {
    property = {
      id: rawProperty.id || '',
      title: rawProperty.title || 'Propiedad',
      coverUrl: rawProperty.coverUrl || rawProperty.cover_url || null
    }
  }

  return {
    threadId: rawThread.threadId || rawThread.thread_id || rawThread.id || '',
    otherUser,
    lastMessage,
    unreadCount: rawThread.unreadCount || rawThread.unread_count || 0,
    updatedAt: 
      rawThread.updatedAt || 
      rawThread.updated_at || 
      new Date().toISOString(),
    property
  }
}

/**
 * Normaliza un array de threads
 * Filtra threads inválidos y devuelve array limpio
 */
export function normalizeThreads(rawThreads: any[]): EnrichedThread[] {
  if (!Array.isArray(rawThreads)) {
    console.warn('[normalizeThreads] Input is not an array:', typeof rawThreads)
    return []
  }

  return rawThreads
    .filter(thread => thread && (thread.threadId || thread.thread_id || thread.id))
    .map(thread => {
      try {
        return normalizeThread(thread)
      } catch (error) {
        console.error('[normalizeThreads] Error normalizing thread:', error)
        return null
      }
    })
    .filter((thread): thread is EnrichedThread => thread !== null)
}

/**
 * Valida que un thread normalizado tenga todos los campos críticos
 */
export function validateThread(thread: EnrichedThread): boolean {
  if (!thread.threadId) {
    console.warn('[validateThread] Missing threadId')
    return false
  }

  if (!thread.otherUser?.displayName) {
    console.warn('[validateThread] Missing otherUser.displayName')
    return false
  }

  if (thread.lastMessage && typeof thread.lastMessage.isMine !== 'boolean') {
    console.warn('[validateThread] lastMessage.isMine is not boolean')
    return false
  }

  return true
}

/**
 * Normaliza y valida threads, filtrando los inválidos
 */
export function normalizeAndValidateThreads(rawThreads: any[]): EnrichedThread[] {
  const normalized = normalizeThreads(rawThreads)
  return normalized.filter(validateThread)
}
