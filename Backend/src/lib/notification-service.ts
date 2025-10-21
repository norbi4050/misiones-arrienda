/**
 * Servicio Centralizado de Notificaciones
 *
 * Maneja el envío de notificaciones para todos los usuarios:
 * - Inquilinos
 * - Inmobiliarias
 *
 * Canales soportados:
 * - Email (Nodemailer/Resend)
 * - In-App (Base de datos)
 * - Push (Futuro)
 */

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-service-simple'

// ========================================
// TIPOS Y CONSTANTES
// ========================================

export type NotificationType =
  // Mensajería
  | 'NEW_MESSAGE'
  | 'MESSAGE_REPLY'

  // Propiedades
  | 'INQUIRY_RECEIVED'
  | 'INQUIRY_REPLY'
  | 'PROPERTY_STATUS_CHANGED'
  | 'PROPERTY_EXPIRING'
  | 'FAVORITE_PROPERTY_UPDATED'
  | 'NEW_PROPERTY_IN_AREA'

  // Social
  | 'LIKE_RECEIVED'
  | 'NEW_FOLLOWER'

  // Pagos y Planes (Inmobiliarias)
  | 'PAYMENT_COMPLETED'
  | 'PLAN_EXPIRING'
  | 'PLAN_EXPIRED'
  | 'INVOICE_READY'
  | 'NEW_FOUNDER_REGISTERED'

  // Sistema
  | 'WELCOME'
  | 'EMAIL_VERIFIED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'SECURITY_ALERT'

  // Marketing
  | 'PROMOTIONAL'
  | 'NEWSLETTER'

export type NotificationChannel = 'email' | 'in_app' | 'push'

export interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  message: string
  channels?: NotificationChannel[] // Default: ['in_app', 'email']
  metadata?: Record<string, any>
  relatedId?: string
  relatedType?: string // 'message', 'property', 'payment', 'inquiry'
}

export interface NotificationPreferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  pushEnabled: boolean

  // Preferencias por tipo
  newMessages: boolean
  messageReplies: boolean
  propertyInquiries: boolean
  propertyStatusChange: boolean
  propertyExpiring: boolean
  favoritesUpdates: boolean
  newPropertiesInArea: boolean
  likesReceived: boolean
  newFollowers: boolean
  paymentCompleted: boolean
  planExpiring: boolean
  invoiceReady: boolean
  systemAnnouncements: boolean
  securityAlerts: boolean
  promotionalEmails: boolean
  newsletter: boolean
}

// Mapeo de tipo de notificación a preferencia
const NOTIFICATION_TYPE_TO_PREFERENCE: Record<NotificationType, keyof NotificationPreferences> = {
  'NEW_MESSAGE': 'newMessages',
  'MESSAGE_REPLY': 'messageReplies',
  'INQUIRY_RECEIVED': 'propertyInquiries',
  'INQUIRY_REPLY': 'propertyInquiries',
  'PROPERTY_STATUS_CHANGED': 'propertyStatusChange',
  'PROPERTY_EXPIRING': 'propertyExpiring',
  'FAVORITE_PROPERTY_UPDATED': 'favoritesUpdates',
  'NEW_PROPERTY_IN_AREA': 'newPropertiesInArea',
  'LIKE_RECEIVED': 'likesReceived',
  'NEW_FOLLOWER': 'newFollowers',
  'PAYMENT_COMPLETED': 'paymentCompleted',
  'PLAN_EXPIRING': 'planExpiring',
  'PLAN_EXPIRED': 'planExpiring',
  'INVOICE_READY': 'invoiceReady',
  'NEW_FOUNDER_REGISTERED': 'systemAnnouncements',
  'WELCOME': 'systemAnnouncements',
  'EMAIL_VERIFIED': 'systemAnnouncements',
  'SYSTEM_ANNOUNCEMENT': 'systemAnnouncements',
  'SECURITY_ALERT': 'securityAlerts',
  'PROMOTIONAL': 'promotionalEmails',
  'NEWSLETTER': 'newsletter',
}

// ========================================
// CLASE PRINCIPAL
// ========================================

class NotificationService {
  /**
   * Envía una notificación a un usuario
   */
  async notify(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()

      // 1. Obtener usuario y sus preferencias
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name, user_type')
        .eq('id', payload.userId)
        .single()

      if (userError || !user) {
        console.error('[NotificationService] User not found:', payload.userId)
        return { success: false, error: 'User not found' }
      }

      // 2. Obtener preferencias de notificación
      const preferences = await this.getPreferences(payload.userId)

      // 3. Verificar si el usuario quiere recibir este tipo de notificación
      const preferenceKey = NOTIFICATION_TYPE_TO_PREFERENCE[payload.type]
      if (preferenceKey && !preferences[preferenceKey]) {
        console.log(`[NotificationService] User ${payload.userId} has disabled ${payload.type}`)
        return { success: true } // No es un error, solo respetamos la preferencia
      }

      // 4. Determinar canales a usar
      const channels = payload.channels || ['in_app', 'email']
      const enabledChannels = channels.filter(channel => {
        if (channel === 'email') return preferences.emailEnabled
        if (channel === 'in_app') return preferences.inAppEnabled
        if (channel === 'push') return preferences.pushEnabled
        return false
      })

      if (enabledChannels.length === 0) {
        console.log(`[NotificationService] No enabled channels for user ${payload.userId}`)
        return { success: true }
      }

      // 5. Crear registro en BD (notificación in-app)
      if (enabledChannels.includes('in_app')) {
        await this.createInAppNotification(payload, enabledChannels)
      }

      // 6. Enviar email si está habilitado
      if (enabledChannels.includes('email') && user.email) {
        await this.sendEmailNotification({
          recipientEmail: user.email,
          recipientName: user.name,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          metadata: payload.metadata,
          userId: payload.userId,
        })
      }

      // 7. TODO: Enviar push notification si está habilitado
      if (enabledChannels.includes('push')) {
        // Implementar en el futuro
        console.log(`[NotificationService] Push notifications not implemented yet`)
      }

      return { success: true }

    } catch (error) {
      console.error('[NotificationService] Error sending notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Crea notificación in-app en la base de datos
   */
  private async createInAppNotification(
    payload: NotificationPayload,
    channels: NotificationChannel[]
  ): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.from('notifications').insert({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      relatedId: payload.relatedId,
      relatedType: payload.relatedType,
      channels: JSON.stringify(channels),
      read: false,
      sentAt: new Date().toISOString(),
    })

    if (error) {
      console.error('[NotificationService] Error creating in-app notification:', error)
      throw error
    }
  }

  /**
   * Envía email de notificación
   */
  private async sendEmailNotification(params: {
    recipientEmail: string
    recipientName: string
    type: NotificationType
    title: string
    message: string
    metadata?: Record<string, any>
    userId: string
  }): Promise<void> {
    const supabase = createClient()

    try {
      // Generar HTML del email (usar template según tipo)
      const emailHtml = await this.generateEmailTemplate(params.type, {
        name: params.recipientName,
        title: params.title,
        message: params.message,
        metadata: params.metadata,
      })

      // Enviar email
      const success = await sendEmail({
        to: params.recipientEmail,
        subject: params.title,
        html: emailHtml,
      })

      // Registrar en email_logs
      await supabase.from('email_logs').insert({
        recipientId: params.userId,
        recipientEmail: params.recipientEmail,
        type: params.type,
        subject: params.title,
        body: emailHtml,
        templateUsed: `template_${params.type.toLowerCase()}`,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date().toISOString() : null,
        errorMessage: success ? null : 'Failed to send email',
        provider: 'nodemailer',
      })

    } catch (error) {
      console.error('[NotificationService] Error sending email:', error)

      // Registrar fallo en email_logs
      await supabase.from('email_logs').insert({
        recipientId: params.userId,
        recipientEmail: params.recipientEmail,
        type: params.type,
        subject: params.title,
        body: '',
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        provider: 'nodemailer',
      })
    }
  }

  /**
   * Genera HTML del email según el tipo de notificación
   */
  private async generateEmailTemplate(
    type: NotificationType,
    data: {
      name: string
      title: string
      message: string
      metadata?: Record<string, any>
    }
  ): Promise<string> {
    // Template básico (mejoraremos esto con templates específicos)
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Misiones Arrienda</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 10px 0;">${data.title}</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Hola ${data.name},
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                ${data.message}
              </p>

              ${data.metadata?.ctaUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.metadata.ctaUrl}" style="background-color: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                      ${data.metadata.ctaText || 'Ver más'}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                Recibiste este email porque estás registrado en Misiones Arrienda.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                <a href="https://www.misionesarrienda.com.ar/notificaciones/preferencias" style="color: #667eea; text-decoration: none;">
                  Gestionar preferencias de notificaciones
                </a> |
                <a href="https://www.misionesarrienda.com.ar/notificaciones/preferencias" style="color: #999999; text-decoration: none;">
                  Dejar de recibir estos emails
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  }

  /**
   * Obtiene las preferencias de notificación de un usuario
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Si no existen preferencias, retornar defaults
      return this.getDefaultPreferences()
    }

    return data as unknown as NotificationPreferences
  }

  /**
   * Actualiza las preferencias de un usuario
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId)

    if (error) {
      console.error('[NotificationService] Error updating preferences:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    const supabase = createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, readAt: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) {
      console.error('[NotificationService] Error marking notification as read:', error)
      return { success: false }
    }

    return { success: true }
  }

  /**
   * Obtiene notificaciones de un usuario
   */
  async getNotifications(userId: string, options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }) {
    const supabase = createClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('read', false)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('[NotificationService] Error fetching notifications:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  }

  /**
   * Cuenta notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = createClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('[NotificationService] Error counting unread notifications:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Preferencias por defecto
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      emailEnabled: true,
      inAppEnabled: true,
      pushEnabled: false,
      newMessages: true,
      messageReplies: true,
      propertyInquiries: true,
      propertyStatusChange: true,
      propertyExpiring: true,
      favoritesUpdates: true,
      newPropertiesInArea: false,
      likesReceived: true,
      newFollowers: false,
      paymentCompleted: true,
      planExpiring: true,
      invoiceReady: true,
      systemAnnouncements: true,
      securityAlerts: true,
      promotionalEmails: false,
      newsletter: false,
    }
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService()

// Exportar funciones de conveniencia
export async function sendNotification(payload: NotificationPayload) {
  return notificationService.notify(payload)
}

export async function getNotificationPreferences(userId: string) {
  return notificationService.getPreferences(userId)
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  return notificationService.updatePreferences(userId, preferences)
}
