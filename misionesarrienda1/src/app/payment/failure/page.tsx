'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PaymentFailurePage() {
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
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pago Rechazado
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu pago no pudo ser procesado. Por favor, intenta nuevamente.
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
                <p className="text-sm text-red-600 font-medium">
                  {paymentInfo.status === 'rejected' ? 'Rechazado' : 'Fallido'}
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
            <h4 className="text-sm font-medium text-gray-900">¿Qué puedes hacer?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Verifica que los datos de tu tarjeta sean correctos</li>
              <li>• Asegúrate de tener fondos suficientes</li>
              <li>• Intenta con otro método de pago</li>
              <li>• Contacta a tu banco si el problema persiste</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button asChild className="flex-1">
            <Link href={paymentInfo?.externalReference ? `/property/${paymentInfo.externalReference}` : '/'}>
              Intentar Nuevamente
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="flex-1">
            <Link href="/">
              Volver al Inicio
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Si necesitas ayuda, puedes contactarnos por WhatsApp
          </p>
        </div>
      </div>
    </div>
  )
}
