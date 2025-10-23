'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, Settings } from 'lucide-react'

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted'
const COOKIE_CONSENT_VERSION = '2025-01-15'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Verificar si ya se dio consentimiento
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const consentData = consent ? JSON.parse(consent) : null

    // Mostrar banner si no hay consentimiento o si la versión cambió
    if (!consentData || consentData.version !== COOKIE_CONSENT_VERSION) {
      setIsVisible(true)
    }

    setIsLoaded(true)
  }, [])

  const handleAccept = () => {
    const consentData = {
      accepted: true,
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    // Disparar evento personalizado para que otros componentes sepan
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
      detail: { accepted: true }
    }))

    setIsVisible(false)
  }

  const handleReject = () => {
    const consentData = {
      accepted: false,
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
      detail: { accepted: false }
    }))

    setIsVisible(false)
  }

  // No renderizar nada hasta que se cargue en el cliente
  if (!isLoaded || !isVisible) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-orange-600 shadow-2xl"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icono */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Cookie className="w-6 h-6 text-orange-600" />
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h2 id="cookie-banner-title" className="text-lg font-semibold text-gray-900 mb-1">
              🍪 Usamos Cookies
            </h2>
            <p id="cookie-banner-description" className="text-sm text-gray-600 leading-relaxed">
              Utilizamos cookies técnicas esenciales y analíticas opcionales para mejorar tu experiencia.
              No vendemos tus datos ni usamos cookies de publicidad. Al continuar navegando, aceptas nuestra{' '}
              <Link
                href="/legal/cookies"
                className="text-orange-600 hover:underline font-medium"
                target="_blank"
              >
                Política de Cookies
              </Link>.
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Link
              href="/privacy-settings"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configurar
            </Link>

            <button
              onClick={handleReject}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Rechazar cookies opcionales"
            >
              Solo esenciales
            </button>

            <button
              onClick={handleAccept}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
              aria-label="Aceptar todas las cookies"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
