/**
 * Componente: NotificationDropdown
 *
 * Dropdown con lista de notificaciones
 * - Muestra últimas notificaciones
 * - Permite marcar como leídas
 * - Link a página completa de notificaciones
 */

'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from './NotificationBell'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications({
    limit: 5,
    enabled: open, // Solo cargar cuando está abierto
  })

  /**
   * Formatear fecha relativa
   */
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

  /**
   * Manejar click en notificación
   */
  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Si tiene CTA URL, redirigir
    if (notification.metadata?.ctaUrl) {
      window.location.href = notification.metadata.ctaUrl
      setOpen(false)
    }
  }

  /**
   * Marcar todas como leídas
   */
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <NotificationBell />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-base font-semibold">Notificaciones</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
              title="Marcar todas como leídas"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Lista de notificaciones */}
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Cargando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No hay notificaciones</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex flex-col items-start gap-2 p-3 cursor-pointer',
                  !notification.read && 'bg-blue-50 hover:bg-blue-100'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Título y badge de no leída */}
                <div className="flex items-start justify-between w-full gap-2">
                  <p className={cn(
                    'text-sm font-medium flex-1',
                    !notification.read && 'text-blue-900'
                  )}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                  )}
                </div>

                {/* Mensaje */}
                <p className="text-xs text-gray-600 line-clamp-2">
                  {notification.message}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {notification.metadata?.ctaText && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      {notification.metadata.ctaText}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}

            {/* Ver todas y Preferencias */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center justify-center text-blue-600 font-medium"
              onClick={() => {
                window.location.href = '/notificaciones'
                setOpen(false)
              }}
            >
              Ver todas las notificaciones
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-center justify-center text-gray-600 text-xs"
              onClick={() => {
                window.location.href = '/notificaciones/preferencias'
                setOpen(false)
              }}
            >
              Configurar preferencias
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
