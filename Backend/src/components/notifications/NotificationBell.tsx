/**
 * Componente: NotificationBell
 *
 * Campana de notificaciones con badge de contador
 * - Muestra número de notificaciones no leídas
 * - Al hacer click, abre dropdown con lista
 */

'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnreadCount } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  onClick?: () => void
  className?: string
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { count, isLoading, error } = useUnreadCount()

  // Si hay error, mostrar campana sin contador
  if (error) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn('relative', className)}
        onClick={onClick}
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('relative', className)}
      onClick={onClick}
      title={count > 0 ? `Tienes ${count} notificaciones sin leer` : 'Notificaciones'}
      aria-label={count > 0 ? `${count} notificaciones sin leer` : 'Notificaciones'}
    >
      <Bell className="h-5 w-5" />

      {/* Badge con contador */}
      {!isLoading && count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  )
}
