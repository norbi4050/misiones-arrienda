// src/components/account/DeleteAccountModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const CONFIRM_WORD = 'ELIMINAR'
  const isConfirmValid = confirmText.trim().toUpperCase() === CONFIRM_WORD

  const handleDelete = async () => {
    if (!isConfirmValid) {
      toast.error('Debes escribir "ELIMINAR" para confirmar')
      return
    }

    try {
      setLoading(true)
      
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al eliminar cuenta')
      }
      
      const { message } = await res.json()
      
      toast.success(message || 'Cuenta eliminada exitosamente')
      
      // Redirigir al home después de 2 segundos
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
      
    } catch (error: any) {
      console.error('[DeleteAccount] Error:', error)
      toast.error(error.message || 'Error al eliminar cuenta')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Paso 1: Advertencia inicial */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                ¿Eliminar tu cuenta?
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-700">
                Esta acción es <strong>permanente</strong> y tendrá las siguientes consecuencias:
              </p>
              
              <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                <li>Todas tus publicaciones serán despublicadas</li>
                <li>Tus posts en la comunidad serán eliminados</li>
                <li>Tu perfil será anonimizado</li>
                <li>No podrás recuperar tu cuenta</li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-red-800">
                  <strong>Nota:</strong> Si solo quieres pausar temporalmente tu cuenta, 
                  considera usar la opción de "Suspender cuenta" en su lugar.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setStep(2)}
                variant="destructive"
                className="flex-1"
                disabled={loading}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {/* Paso 2: Confirmación con texto */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Confirmación final
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                Para confirmar la eliminación de tu cuenta, escribe la palabra{' '}
                <strong className="text-red-600">{CONFIRM_WORD}</strong> en el campo de abajo:
              </p>
              
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Escribe "${CONFIRM_WORD}"`}
                className="font-mono"
                disabled={loading}
                autoFocus
              />
              
              {confirmText && !isConfirmValid && (
                <p className="text-xs text-red-600 mt-2">
                  El texto no coincide. Debe ser exactamente "{CONFIRM_WORD}"
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Atrás
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1"
                disabled={!isConfirmValid || loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar mi cuenta'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
