'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MERCADOPAGO_CONFIG } from '@/lib/mercadopago'

interface PaymentButtonProps {
  propertyId: string
  propertyTitle: string
  amount: number
  userEmail?: string
  userName?: string
  className?: string
}

export function PaymentButton({
  propertyId,
  propertyTitle,
  amount,
  userEmail = 'usuario@ejemplo.com',
  userName = 'Usuario',
  className
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Crear preferencia de pago
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          amount,
          title: propertyTitle,
          description: `Pago por propiedad: ${propertyTitle}`,
          userEmail,
          userName
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear la preferencia de pago')
      }

      const data = await response.json()

      if (data.success && data.preference) {
        // Redirigir a MercadoPago
        window.location.href = data.preference.init_point
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error)
      alert('Error al procesar el pago. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className={className}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Procesando...
        </div>
      ) : (
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Pagar ${amount.toLocaleString('es-AR')}
        </div>
      )}
    </Button>
  )
}

// Componente para mostrar información de MercadoPago
export function MercadoPagoInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Pago Seguro con MercadoPago
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Pago 100% seguro y protegido</li>
              <li>Acepta tarjetas de crédito y débito</li>
              <li>También puedes pagar en efectivo</li>
              <li>Hasta 12 cuotas sin interés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar métodos de pago disponibles
export function PaymentMethods() {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Métodos de pago disponibles:</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center p-3 border rounded-lg">
          <div className="text-sm">
            <div className="font-medium">Tarjetas</div>
            <div className="text-gray-500">Visa, Mastercard, Amex</div>
          </div>
        </div>
        <div className="flex items-center p-3 border rounded-lg">
          <div className="text-sm">
            <div className="font-medium">Efectivo</div>
            <div className="text-gray-500">Pago Fácil, Rapipago</div>
          </div>
        </div>
        <div className="flex items-center p-3 border rounded-lg">
          <div className="text-sm">
            <div className="font-medium">Transferencia</div>
            <div className="text-gray-500">Débito inmediato</div>
          </div>
        </div>
        <div className="flex items-center p-3 border rounded-lg">
          <div className="text-sm">
            <div className="font-medium">Cuotas</div>
            <div className="text-gray-500">Hasta 12 sin interés</div>
          </div>
        </div>
      </div>
    </div>
  )
}
