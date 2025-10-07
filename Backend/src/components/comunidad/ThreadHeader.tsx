'use client'

import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ThreadHeaderProps {
  participant: {
    displayName: string
    avatarUrl?: string | null
    profileUpdatedAt?: string | number | null
    presence?: {
      isOnline: boolean
      lastSeen: string | null
      lastActivity: string
    }
  }
  matchStatus?: string
}

export default function ThreadHeader({ participant, matchStatus }: ThreadHeaderProps) {
  const router = useRouter()
  
  // Cache-busting para avatar
  const cacheBuster = participant.profileUpdatedAt 
    ? `?v=${new Date(participant.profileUpdatedAt).getTime()}`
    : ''
  
  const avatarUrl = participant.avatarUrl 
    ? participant.avatarUrl + cacheBuster
    : undefined

  /**
   * Formatea el texto de última conexión según el estado de presencia
   */
  const getLastSeenText = () => {
    if (!participant.presence) {
      return null
    }
    
    // Usuario está online
    if (participant.presence.isOnline) {
      return 'En línea'
    }
    
    // Usuario está offline - mostrar última conexión
    if (participant.presence.lastSeen) {
      try {
        const lastSeenDate = new Date(participant.presence.lastSeen)
        return `Últ. vez ${formatDistanceToNow(lastSeenDate, { 
          addSuffix: true,
          locale: es 
        })}`
      } catch (error) {
        console.error('[ThreadHeader] Error formatting lastSeen:', error)
        return 'Desconectado'
      }
    }
    
    return 'Desconectado'
  }

  const lastSeenText = getLastSeenText()
  const isOnline = participant.presence?.isOnline || false

  // Log de diagnóstico (solo dev)
  if (process.env.NODE_ENV === 'development') {
    console.info('🔍 ThreadHeader participant ->', participant)
    console.info('🔍 ThreadHeader presence ->', participant.presence)
  }

  return (
    <div className="border-b bg-white p-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
      {/* Botón volver */}
      <button
        onClick={() => router.back()}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Volver"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      {/* Avatar con indicador de presencia */}
      <div className="relative">
        <SafeAvatar
          src={avatarUrl}
          name={participant.displayName}
          size="md"
        />
        
        {/* Indicador online/offline - Badge absoluto sobre avatar */}
        {participant.presence && (
          <div 
            className={`
              absolute bottom-0 right-0 
              w-3 h-3 rounded-full 
              border-2 border-white
              ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
            `}
            title={isOnline ? 'En línea' : 'Desconectado'}
            aria-label={isOnline ? 'Usuario en línea' : 'Usuario desconectado'}
          />
        )}
      </div>
      
      {/* Info del participante */}
      <div className="flex-1 min-w-0">
        {/* Nombre del usuario */}
        <h2 className="font-semibold text-gray-900 truncate">
          {participant.displayName}
        </h2>
        
        {/* Estado online/última conexión */}
        {lastSeenText && (
          <p 
            className={`
              text-xs truncate
              ${isOnline ? 'text-green-600 font-medium' : 'text-gray-500'}
            `}
          >
            {lastSeenText}
          </p>
        )}
        
        {/* Match status (si aplica) */}
        {matchStatus && !lastSeenText && (
          <p className="text-sm text-gray-500">
            Match: {matchStatus === 'active' ? 'Activo' : matchStatus}
          </p>
        )}
      </div>
    </div>
  )
}
