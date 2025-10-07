// Tipos para el sistema de mensajes

// Tipo para adjuntos de mensajes
export interface Attachment {
  id: string;
  url: string;
  mime: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  fileName: string;
  createdAt: string;
}

export interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  conversation_id: string
  created_at: string
  updated_at: string
  read: boolean
  type?: 'TEXT' | 'IMAGE' | 'SYSTEM'
  attachments?: Attachment[]
}

// ============================================
// PROMPT 1: Tipos enriquecidos para API responses
// ============================================

// ============================================
// SISTEMA DE PRESENCIA - Tipos (NUEVO 2025)
// ============================================

/**
 * Información de presencia del usuario
 * Indica si está online y cuándo fue su última actividad
 */
export interface UserPresence {
  isOnline: boolean        // true si el usuario está actualmente online
  lastSeen: string | null  // ISO timestamp de última vez visto (null si nunca)
  lastActivity: string     // ISO timestamp de última actividad registrada
}

/**
 * Información del otro usuario en un thread
 * PROMPT 1: displayName calculado server-side con lógica de prioridad
 * ACTUALIZADO: Incluye información de presencia opcional
 */
export interface EnrichedOtherUser {
  id: string
  displayName: string      // Calculado: User.name → UserProfile.full_name/companyName → email local → "Usuario"
  avatarUrl: string | null
  presence?: UserPresence  // Información de presencia (opcional para compatibilidad)
}

/**
 * Último mensaje de un thread enriquecido
 * PROMPT 1: Incluye senderId e isMine calculado server-side
 */
export interface EnrichedLastMessage {
  id: string
  content: string
  createdAt: string
  senderId: string         // ID del perfil que envió el mensaje
  isMine: boolean          // Calculado server-side comparando senderId con usuario actual
}

/**
 * Información de propiedad asociada a un thread
 * PROMPT 1: Datos básicos de la propiedad si aplica
 */
export interface ThreadProperty {
  id: string
  title: string
  coverUrl: string | null
}

/**
 * Thread enriquecido según PROMPT 1
 * Formato de respuesta de GET /api/messages/threads
 */
export interface EnrichedThread {
  threadId: string
  otherUser: EnrichedOtherUser
  lastMessage: EnrichedLastMessage | null
  unreadCount: number
  updatedAt: string
  property?: ThreadProperty | null
}

/**
 * Mensaje enriquecido según PROMPT 1
 * Formato de respuesta de GET /api/messages/threads/[id]
 */
export interface EnrichedMessage {
  id: string
  content: string
  createdAt: string
  senderId: string
  isMine: boolean          // Calculado server-side
  attachments?: Attachment[]
}

/**
 * Detalle completo de un thread
 * Formato de respuesta de GET /api/messages/threads/[id]
 */
export interface EnrichedThreadDetail {
  threadId: string
  otherUser: EnrichedOtherUser
  messages: EnrichedMessage[]
  property?: ThreadProperty | null
}

export interface Conversation {
  id: string
  property_id: string
  property_title: string
  property_image?: string
  property_price?: number
  property_city?: string
  participant1_id: string
  participant2_id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
  last_message: string
  last_message_time: string
  last_message_sender_id: string
  unread_count: number
  created_at: string
  updated_at: string
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED'
  messages?: Message[]
}

export interface ConversationFilters {
  search?: string
  status?: Conversation['status']
  unreadOnly?: boolean
  propertyId?: string
  userId?: string
}

export interface CreateConversationData {
  propertyId: string
  recipientId: string
  message: string
}

export interface SendMessageData {
  conversationId: string
  content: string
  type?: Message['type']
}

export interface ConversationStats {
  total: number
  unread: number
  active: number
  archived: number
}

// Tipos para notificaciones de mensajes
export interface MessageNotification {
  id: string
  user_id: string
  conversation_id: string
  message_id: string
  type: 'NEW_MESSAGE' | 'NEW_CONVERSATION'
  read: boolean
  created_at: string
  data: {
    sender_name: string
    sender_avatar?: string
    property_title?: string
    message_preview: string
  }
}

// Tipos para el contexto de mensajes
export interface MessagesContextType {
  conversations: Conversation[]
  activeConversation: Conversation | null
  loading: boolean
  error: string | null
  unreadCount: number
  stats: ConversationStats
  setActiveConversation: (conversation: Conversation | null) => void
  sendMessage: (conversationId: string, content: string) => Promise<boolean>
  createConversation: (propertyId: string, recipientId: string, initialMessage: string) => Promise<string | null>
  markAsRead: (conversationId: string) => Promise<void>
  archiveConversation: (conversationId: string) => Promise<boolean>
  blockConversation: (conversationId: string) => Promise<boolean>
  refreshConversations: () => Promise<void>
  getConversationMessages: (conversationId: string) => Promise<Message[]>
}

// Tipos para respuestas de API
export interface MessagesApiResponse {
  success: boolean
  conversations?: Conversation[]
  conversation?: Conversation
  messages?: Message[]
  message?: Message
  conversationId?: string
  error?: string
}

export interface ConversationApiResponse {
  success: boolean
  conversation?: Conversation
  messages?: Message[]
  error?: string
}

// Tipos para el hook de mensajes
export interface UseMessagesReturn {
  conversations: Conversation[]
  loading: boolean
  error: string | null
  unreadCount: number
  sendMessage: (conversationId: string, content: string) => Promise<boolean>
  createConversation: (propertyId: string, recipientId: string, message: string) => Promise<string | null>
  markAsRead: (conversationId: string) => Promise<void>
  refreshConversations: () => Promise<void>
}

// ============================================
// UNIFICACIÓN DE MENSAJERÍA - Tipos
// ============================================

/**
 * Tipo de mensaje: propiedad o comunidad
 */
export type MessageType = 'property' | 'community'

/**
 * Conversación unificada que puede ser de propiedades o comunidad
 */
export interface UnifiedConversation {
  id: string
  type: MessageType
  otherUser: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
  lastMessage: {
    content: string
    createdAt: string
    isMine: boolean
  } | null
  unreadCount: number
  updatedAt: string
  property?: {
    id: string
    title: string
    coverUrl: string | null
  }
}

/**
 * Respuesta del endpoint unificado
 */
export interface UnifiedMessagesResponse {
  success: boolean
  conversations: UnifiedConversation[]
  counts: {
    all: number
    properties: number
    community: number
  }
  _meta: {
    duration_ms: number
  }
}

/**
 * Parámetros de filtro para mensajes unificados
 */
export type UnifiedMessageFilter = 'all' | 'properties' | 'community'
