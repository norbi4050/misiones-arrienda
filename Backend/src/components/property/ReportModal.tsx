'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Flag } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
}

type ReportReason =
  | 'scam'
  | 'fake_images'
  | 'unrealistic_price'
  | 'wrong_location'
  | 'not_available'
  | 'false_info'
  | 'duplicate'
  | 'other'

interface ReportOption {
  value: ReportReason
  label: string
  description: string
  icon: string
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    value: 'scam',
    label: 'Estafa o Fraude',
    description: 'La publicación parece ser una estafa',
    icon: '🚨'
  },
  {
    value: 'fake_images',
    label: 'Fotos Falsas',
    description: 'Las fotos no corresponden a la propiedad real',
    icon: '📸'
  },
  {
    value: 'unrealistic_price',
    label: 'Precio Irreal',
    description: 'El precio es sospechosamente bajo o alto',
    icon: '💰'
  },
  {
    value: 'wrong_location',
    label: 'Ubicación Incorrecta',
    description: 'La dirección no coincide con la realidad',
    icon: '📍'
  },
  {
    value: 'not_available',
    label: 'No Disponible',
    description: 'La propiedad ya no está disponible',
    icon: '❌'
  },
  {
    value: 'false_info',
    label: 'Información Falsa',
    description: 'Contiene información engañosa o incorrecta',
    icon: '📝'
  },
  {
    value: 'duplicate',
    label: 'Publicación Duplicada',
    description: 'Esta propiedad ya está publicada',
    icon: '🔄'
  },
  {
    value: 'other',
    label: 'Otro Motivo',
    description: 'Especifica el motivo en los detalles',
    icon: '🚫'
  }
]

export function ReportModal({ isOpen, onClose, propertyId, propertyTitle }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedReason) {
      toast.error('Por favor selecciona un motivo')
      return
    }

    if (details.trim().length < 10) {
      toast.error('Por favor proporciona más detalles (mínimo 10 caracteres)')
      return
    }

    if (details.trim().length > 500) {
      toast.error('Los detalles no pueden exceder 500 caracteres')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/properties/${propertyId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: selectedReason,
          details: details.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el reporte')
      }

      // Éxito
      setIsSuccess(true)
      toast.success('Reporte enviado correctamente')

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar el reporte')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setDetails('')
    setIsSuccess(false)
    onClose()
  }

  // Vista de éxito
  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Reporte Enviado!
          </h3>
          <p className="text-gray-600 mb-4">
            Gracias por ayudarnos a mantener la plataforma segura. <br />
            Nuestro equipo revisará tu reporte en breve.
          </p>
          <Button onClick={handleClose} className="mt-4">
            Cerrar
          </Button>
        </div>
      </Modal>
    )
  }

  // Vista principal del formulario
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reportar Propiedad"
      size="lg"
    >
      <div className="p-6">
        {/* Información de la propiedad */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Reportando:</p>
          <p className="font-semibold text-gray-900">{propertyTitle}</p>
        </div>

        {/* Alerta informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Por qué reportar?</p>
            <p>
              Los reportes nos ayudan a identificar contenido fraudulento o inapropiado.
              Tu reporte será revisado por nuestro equipo.
            </p>
          </div>
        </div>

        {/* Selección de motivo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Motivo del reporte <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REPORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedReason(option.value)}
                className={`
                  text-left p-4 rounded-lg border-2 transition-all
                  ${selectedReason === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`
                      font-medium text-sm
                      ${selectedReason === option.value ? 'text-blue-900' : 'text-gray-900'}
                    `}>
                      {option.label}
                    </p>
                    <p className={`
                      text-xs mt-1
                      ${selectedReason === option.value ? 'text-blue-700' : 'text-gray-500'}
                    `}>
                      {option.description}
                    </p>
                  </div>
                  {selectedReason === option.value && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalles adicionales */}
        <div className="mb-6">
          <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
            Detalles adicionales <span className="text-red-500">*</span>
          </label>
          <textarea
            id="details"
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Por favor proporciona más información sobre el problema (mínimo 10 caracteres)..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500">
              Mínimo 10 caracteres
            </p>
            <p className={`text-xs ${details.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
              {details.length}/500
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason || details.trim().length < 10}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Enviando...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2" />
                Enviar Reporte
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
