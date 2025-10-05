/**
 * PROMPT 3: Normalización consistente de mensajes
 * 
 * Blindar el cliente ante pequeñas variaciones del API.
 * Asegurar que isMine sea boolean estricto.
 */

import type { EnrichedMessage, Attachment } from '@/types/messages'

/**
 * Normaliza un mensaje individual desde el formato del API
 * Maneja variaciones de naming (camelCase vs snake_case)
 */
export function normalizeMessage(rawMessage: any): EnrichedMessage {
  if (!rawMessage) {
    throw new Error('rawMessage is required')
  }

  // Normalizar attachments si existen
  const attachments: Attachment[] = []
  if (Array.isArray(rawMessage.attachments)) {
    rawMessage.attachments.forEach((att: any) => {
      if (att && att.id) {
        attachments.push({
          id: att.id,
          url: att.url || '',
          mime: att.mime || att.mimeType || 'application/octet-stream',
          sizeBytes: att.sizeBytes || att.size_bytes || att.size || 0,
          width: att.width,
          height: att.height,
          fileName: att.fileName || att.file_name || 'file',
          createdAt: att.createdAt || att.created_at || new Date().toISOString()
        })
      }
    })
  }

  return {
    id: rawMessage.id || '',
    content: 
      rawMessage.content || 
      rawMessage.body || 
      rawMessage.text || 
      '',
    createdAt: 
      rawMessage.createdAt || 
      rawMessage.created_at || 
      new Date().toISOString(),
    senderId: 
      rawMessage.senderId || 
      rawMessage.sender_id || 
      '',
    isMine: Boolean(rawMessage.isMine || rawMessage.is_mine),  // Boolean estricto
    attachments: attachments.length > 0 ? attachments : undefined
  }
}

/**
 * Normaliza un array de mensajes
 * Filtra mensajes inválidos y devuelve array limpio
 */
export function normalizeMessages(rawMessages: any[]): EnrichedMessage[] {
  if (!Array.isArray(rawMessages)) {
    console.warn('[normalizeMessages] Input is not an array:', typeof rawMessages)
    return []
  }

  return rawMessages
    .filter(message => message && message.id)
    .map(message => {
      try {
        return normalizeMessage(message)
      } catch (error) {
        console.error('[normalizeMessages] Error normalizing message:', error)
        return null
      }
    })
    .filter((message): message is EnrichedMessage => message !== null)
}

/**
 * Valida que un mensaje normalizado tenga todos los campos críticos
 */
export function validateMessage(message: EnrichedMessage): boolean {
  if (!message.id) {
    console.warn('[validateMessage] Missing id')
    return false
  }

  if (!message.content && message.content !== '') {
    console.warn('[validateMessage] Missing content')
    return false
  }

  if (typeof message.isMine !== 'boolean') {
    console.warn('[validateMessage] isMine is not boolean:', typeof message.isMine)
    return false
  }

  if (!message.senderId) {
    console.warn('[validateMessage] Missing senderId')
    return false
  }

  return true
}

/**
 * Normaliza y valida mensajes, filtrando los inválidos
 */
export function normalizeAndValidateMessages(rawMessages: any[]): EnrichedMessage[] {
  const normalized = normalizeMessages(rawMessages)
  return normalized.filter(validateMessage)
}

/**
 * Agrupa mensajes por fecha para mostrar separadores en UI
 */
export function groupMessagesByDate(messages: EnrichedMessage[]): Map<string, EnrichedMessage[]> {
  const groups = new Map<string, EnrichedMessage[]>()

  messages.forEach(message => {
    const date = new Date(message.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(message)
  })

  return groups
}

/**
 * Formatea la hora de un mensaje para mostrar en UI
 */
export function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Determina si dos mensajes consecutivos son del mismo remitente
 * Útil para agrupar burbujas en UI
 */
export function isSameSender(msg1: EnrichedMessage | null, msg2: EnrichedMessage | null): boolean {
  if (!msg1 || !msg2) return false
  return msg1.senderId === msg2.senderId
}
