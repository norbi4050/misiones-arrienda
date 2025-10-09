// src/app/settings/account/account-client.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteAccountModal } from '@/components/account/DeleteAccountModal'
import { SuspendedBanner } from '@/components/account/SuspendedBanner'
import { toast } from 'sonner'
import { 
  getAccountStatusLabel, 
  getAccountStatusColor,
  isAccountSuspended,
  isAccountActive 
} from '@/lib/account-guards'

interface AccountClientProps {
  initialProfile: any
}

export default function AccountClient({ initialProfile }: AccountClientProps) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const currentStatus = profile?.status || 'active'
  const isSuspended = isAccountSuspended(currentStatus)
  const isActive = isAccountActive(currentStatus)

  const handleToggleSuspend = async () => {
    try {
      setLoading(true)
      
      const res = await fetch('/api/users/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: isActive }) // Si está activa, suspender
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al actualizar estado')
      }
      
      const { data, message } = await res.json()
      
      // Actualizar estado local
      setProfile((prev: any) => ({ ...prev, status: data.status }))
      
      toast.success(message)
      router.refresh()
      
    } catch (error: any) {
      console.error('[ToggleSuspend] Error:', error)
      toast.error(error.message || 'Error al actualizar estado de cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración de Cuenta
          </h1>
          <p className="mt-2 text-gray-600">
            Administra el estado y la seguridad de tu cuenta
          </p>
        </div>

        {/* Banner de cuenta suspendida */}
        <SuspendedBanner />

        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Sección: Estado de cuenta */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Estado de la cuenta
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tu cuenta está actualmente:{' '}
                    <span className={`font-semibold ${
                      currentStatus === 'active' ? 'text-green-600' :
                      currentStatus === 'suspended' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {getAccountStatusLabel(currentStatus)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Badge de estado */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                currentStatus === 'active' ? 'bg-green-100 text-green-800' :
                currentStatus === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentStatus === 'active' && <CheckCircle2 className="h-3 w-3" />}
                {currentStatus === 'suspended' && <AlertTriangle className="h-3 w-3" />}
                {currentStatus === 'deleted' && <XCircle className="h-3 w-3" />}
                {getAccountStatusLabel(currentStatus)}
              </div>
            </div>
          </div>

          {/* Sección: Suspender cuenta */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Suspender cuenta temporalmente
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isSuspended 
                ? 'Tu cuenta está suspendida. Puedes reactivarla en cualquier momento.'
                : 'Suspende tu cuenta temporalmente. Podrás reactivarla cuando quieras.'}
            </p>
            
            {isSuspended && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  Mientras tu cuenta esté suspendida, no podrás publicar propiedades ni enviar mensajes.
                </p>
              </div>
            )}

            <Button
              onClick={handleToggleSuspend}
              variant={isSuspended ? 'default' : 'outline'}
              disabled={loading || currentStatus === 'deleted'}
              className={isSuspended ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {loading ? 'Procesando...' : isSuspended ? 'Reactivar cuenta' : 'Suspender cuenta'}
            </Button>
          </div>

          {/* Sección: Eliminar cuenta */}
          <div className="p-6 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-red-900 mb-2">
                  Zona de peligro
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Eliminar tu cuenta es una acción <strong>permanente</strong> y no se puede deshacer. 
                  Todos tus datos serán anonimizados y tus publicaciones despublicadas.
                </p>
                
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="destructive"
                  disabled={loading || currentStatus === 'deleted'}
                >
                  Eliminar mi cuenta
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            ℹ️ Información importante
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Suspender:</strong> Pausa temporal, puedes reactivar cuando quieras</li>
            <li>• <strong>Eliminar:</strong> Acción permanente, no se puede deshacer</li>
            <li>• Tus datos se mantienen por razones legales y de auditoría</li>
            <li>• Para más información, consulta nuestra <a href="/legal/privacy" className="underline">Política de Privacidad</a></li>
          </ul>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
