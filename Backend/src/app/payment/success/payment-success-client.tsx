'use client'

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState({
    plan: '',
    property: '',
    paymentId: '',
    status: ''
  })

  const planNames = {
    'basico': 'Plan Básico',
    'destacado': 'Plan Destacado',
    'full': 'Plan Full'
  }

  const planPrices = {
    'basico': '$0',
    'destacado': '$5.000',
    'full': '$10.000'
  }

  useEffect(() => {
    setPaymentData({
      plan: searchParams.get('plan') || '',
      property: searchParams.get('property') || '',
      paymentId: searchParams.get('payment_id') || '',
      status: searchParams.get('status') || ''
    })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-gray-600">
              Tu propiedad ha sido actualizada al plan premium
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Detalles del Pago</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Plan Seleccionado:</span>
                <span className="font-semibold text-gray-900">
                  {planNames[paymentData.plan as keyof typeof planNames] || 'Plan Desconocido'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Precio:</span>
                <span className="font-semibold text-gray-900">
                  {planPrices[paymentData.plan as keyof typeof planPrices] || '$0'}/mes
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">ID de Pago:</span>
                <span className="font-mono text-sm text-gray-900">
                  {paymentData.paymentId || 'MP-' + Date.now()}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Estado:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Aprobado
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Vigencia:</span>
                <span className="font-semibold text-gray-900">
                  30 días desde hoy
                </span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              ¿Qué incluye tu plan?
            </h3>
            
            {paymentData.plan === 'destacado' && (
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Badge "Destacado" rojo en tu propiedad
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Tu propiedad aparece primero en los resultados
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Hasta 10 fotos de tu propiedad
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Mayor visibilidad y más consultas
                </li>
              </ul>
            )}

            {paymentData.plan === 'full' && (
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Todo lo del Plan Destacado
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Video promocional de tu propiedad
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Agente inmobiliario asignado
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Fotos ilimitadas
                </li>
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto">
                Ver Dashboard
              </Button>
            </Link>
            <Link href="/" prefetch={false}>
              <Button variant="outline" className="w-full sm:w-auto">
                Volver al Inicio
              </Button>
            </Link>
          </div>

          {/* Contact Info */}
          <div className="text-center mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              ¿Tienes alguna pregunta? Contáctanos en{' '}
              <a href="mailto:soporte@misionesarrienda.com" className="text-blue-600 hover:underline">
                soporte@misionesarrienda.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
