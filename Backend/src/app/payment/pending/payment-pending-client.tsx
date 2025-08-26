'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PaymentPendingClient() {
  const searchParams = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    const status = searchParams.get('status')
    const externalReference = searchParams.get('external_reference')

    setPaymentInfo({
      paymentId,
      status,
      externalReference
    })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pago Pendiente
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu pago está siendo procesado. Te notificaremos cuando se complete.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Detalles del Pago
          </h3>
          
          {paymentInfo && (
            <div className="space-y-3">
              {paymentInfo.paymentId && (
                <div>
                  <span className="text-sm font-medium text-gray-500">ID de Pago:</span>
                  <p className="text-sm text-gray-900">{paymentInfo.paymentId}</p>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-gray-500">Estado:</span>
                <p className="text-sm text-yellow-600 font-medium">
                  Pendiente de Procesamiento
                </p>
              </div>

              {paymentInfo.externalReference && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Referencia:</span>
                  <p className="text-sm text-gray-900">{paymentInfo.externalReference}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-gray-900">¿Qué sigue?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Tu pago está siendo verificado</li>
              <li>• Recibirás una notificación por email cuando se complete</li>
              <li>• El proceso puede tomar hasta 24 horas</li>
              <li>• Puedes consultar el estado en tu perfil</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Importante:</strong> Guarda este número de referencia para futuras consultas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button asChild className="flex-1">
            <Link href="/">
              Volver al Inicio
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard">
              Ver Mi Perfil
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Si tienes dudas, puedes contactarnos por WhatsApp
          </p>
        </div>
      </div>
    </div>
  )
}
