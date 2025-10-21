'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Bell, Check, CheckCheck, Loader2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotifications({
    unreadOnly: filter === 'unread',
    limit: 50
  })

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navegar a la URL si existe
    if (notification.metadata?.ctaUrl) {
      router.push(notification.metadata.ctaUrl)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      })
    } catch {
      return 'Hace un momento'
    }
  }

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      NEW_MESSAGE: '💬',
      MESSAGE_REPLY: '💬',
      INQUIRY_RECEIVED: '📧',
      INQUIRY_REPLY: '📧',
      PROPERTY_STATUS_CHANGED: '🏠',
      FAVORITE_PROPERTY_UPDATED: '⭐',
      LIKE_RECEIVED: '❤️',
      NEW_FOLLOWER: '👥',
      PAYMENT_COMPLETED: '💳',
      PLAN_EXPIRING: '⏰',
      PLAN_EXPIRED: '❌',
      WELCOME: '👋',
      EMAIL_VERIFIED: '✅',
      SYSTEM_ANNOUNCEMENT: '📢',
    }
    return iconMap[type] || '🔔'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Notificaciones
        </h1>
        <p className="text-gray-600">
          Mantente al día con todas tus actualizaciones
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            No leídas
          </Button>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-700"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {filter === 'unread'
              ? 'No tienes notificaciones sin leer'
              : 'No tienes notificaciones'
            }
          </h3>
          <p className="text-gray-500">
            {filter === 'unread'
              ? 'Todas tus notificaciones están al día'
              : 'Las notificaciones aparecerán aquí cuando tengas actualizaciones'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${!notification.read
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 text-2xl mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full mt-2" />
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatTimeAgo(notification.createdAt)}</span>

                    {notification.metadata?.ctaText && (
                      <span className="text-blue-600 font-medium">
                        {notification.metadata.ctaText} →
                      </span>
                    )}
                  </div>
                </div>

                {/* Mark as read button */}
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(notification.id)
                    }}
                    className="flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More - if needed in the future */}
      {notifications.length >= 50 && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={refresh}>
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}
