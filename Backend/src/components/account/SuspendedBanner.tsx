// src/components/account/SuspendedBanner.tsx
'use client'

import { AlertTriangle } from 'lucide-react'
import { useAccountStatus } from '@/hooks/useAccountStatus'

export function SuspendedBanner() {
  const { isSuspended, statusMessage } = useAccountStatus()

  if (!isSuspended || !statusMessage) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Cuenta Suspendida
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            {statusMessage}
          </p>
          <p className="mt-2 text-xs text-yellow-600">
            Puedes reactivar tu cuenta desde la configuración de tu perfil.
          </p>
        </div>
      </div>
    </div>
  )
}
