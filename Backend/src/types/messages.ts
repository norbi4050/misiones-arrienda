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
