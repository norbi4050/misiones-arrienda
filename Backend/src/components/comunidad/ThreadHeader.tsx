'use client'

import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ThreadHeaderProps {
  participant: {
    displayName: string
    avatarUrl?: string | null
    profileUpdatedAt?: string | number | null
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
  
  // Inicial del nombre (fallback si no hay avatar)
  const initial = participant.displayName?.charAt(0).toUpperCase() || '?'

  // Log de diagnóstico (solo dev)
  if (process.env.NODE_ENV === 'development') {
    console.info('🔍 ThreadHeader participant ->', participant)
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

      {/* Avatar con SafeAvatar */}
      <SafeAvatar
        src={avatarUrl}
        name={participant.displayName}
        size="md"
      />
      
      {/* Info del participante */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-900 truncate">
          {participant.displayName}
        </h2>
        {matchStatus && (
          <p className="text-sm text-gray-500">
            Match: {matchStatus === 'active' ? 'Activo' : matchStatus}
          </p>
        )}
      </div>
    </div>
  )
}
