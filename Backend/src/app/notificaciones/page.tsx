'use client'

/**
 * Página: /notificaciones
 *
 * Lista completa de notificaciones del usuario
 * - Filtros: Todas / No leídas
 * - Paginación
 * - Marcar como leídas
 * - Redirigir al hacer click
 */

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Bell, Check, CheckCheck, Settings, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { notifications, isLoading, markAsRead, markAllAsRead, refresh } = useNotifications({
    unreadOnly: filter === 'unread',
    limit: 50,
  })

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Redirigir si tiene CTA
    if (notification.metadata?.ctaUrl) {
      window.location.href = notification.metadata.ctaUrl
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    refresh()
  }

  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: es,
      })
    } catch {
      return 'Hace un momento'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notificaciones
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Mantente al día con todas tus notificaciones
              </p>
            </div>

            <Link href="/notificaciones/preferencias">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Preferencias
              </Button>
            </Link>
          </div>

          {/* Filtros y acciones */}
          <div className="flex items-center justify-between mt-6 gap-4">
            {/* Filtros */}
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

            {/* Marcar todas como leídas */}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'unread'
                  ? 'Todas tus notificaciones están al día'
                  : 'Cuando recibas notificaciones, aparecerán aquí'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                    !notification.read && 'bg-blue-50 hover:bg-blue-100'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Badge de no leída */}
                    <div className="flex-shrink-0 mt-1">
                      {!notification.read ? (
                        <span className="flex h-3 w-3 rounded-full bg-blue-600" />
                      ) : (
                        <span className="flex h-3 w-3 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className={cn(
                            'text-sm font-medium',
                            !notification.read ? 'text-blue-900' : 'text-gray-900'
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.metadata?.ctaText && (
                              <span className="text-xs text-blue-600 font-medium">
                                {notification.metadata.ctaText} →
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón marcar como leída */}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            title="Marcar como leída"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        {notifications.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Mostrando {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
