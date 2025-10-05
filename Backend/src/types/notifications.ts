// src/types/notifications.ts
// Tipos para sistema de notificaciones

export type NotificationType = 
  | 'messages.new'       // Nuevo mensaje
  | 'messages.reply'     // Respuesta en conversación
  | 'community.match'    // Match en comunidad (futuro)

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string | null
  payload?: NotificationPayload
  read_at?: string | null
  created_at: string
}

export interface NotificationPayload {
  conversationId?: string
  messageId?: string
  postId?: string
  [key: string]: any
}

export interface NotificationPreferences {
  user_id: string
  email_enabled: boolean
  types: {
    'messages.new': boolean
    'messages.reply': boolean
    'community.match': boolean
  }
  created_at: string
  updated_at: string
}

// API Response Types
export interface NotificationsListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
  page: number
  per_page: number
  has_more: boolean
}

export interface MarkAsReadResponse {
  id: string
  read_at: string
}

export interface DeleteNotificationResponse {
  id: string
  deleted: boolean
}

export interface UpdatePreferencesRequest {
  email_enabled?: boolean
  types?: Partial<NotificationPreferences['types']>
}

export interface UpdatePreferencesResponse {
  user_id: string
  email_enabled: boolean
  types: NotificationPreferences['types']
  updated_at: string
}
