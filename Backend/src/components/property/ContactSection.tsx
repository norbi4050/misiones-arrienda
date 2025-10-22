"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Lock, Phone, Mail, User, CheckCircle } from 'lucide-react'

interface ContactSectionProps {
  propertyId: string
  contactPhone?: string | null
  contactEmail?: string | null
  contactName?: string | null
  requiresAuth: boolean
  isAuthenticated: boolean
}

export function ContactSection({
  propertyId,
  contactPhone,
  contactEmail,
  contactName,
  requiresAuth,
  isAuthenticated
}: ContactSectionProps) {
  const router = useRouter()
  const [isRevealed, setIsRevealed] = useState(false)

  // Si no requiere auth o ya está revelado, mostrar datos completos
  if (!requiresAuth || isRevealed) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Datos de contacto
          </h3>
        </div>

        <div className="space-y-3">
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{contactPhone}</span>
            </a>
          )}

          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{contactEmail}</span>
            </a>
          )}

          {contactName && (
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{contactName}</span>
            </div>
          )}

          {!contactPhone && !contactEmail && !contactName && (
            <p className="text-sm text-gray-500">
              Información de contacto no disponible
            </p>
          )}
        </div>
      </div>
    )
  }

  // Usuario NO autenticado: mostrar blur y CTA
  const handleRevealClick = () => {
    if (!isAuthenticated) {
      // Guardar URL actual para redirect después del login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirect_after_login', window.location.pathname)
        router.push('/login?reason=contact_unlock')
      }
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-600 p-3 rounded-full">
          <Lock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Inicia sesión para ver el contacto
          </h3>
          <p className="text-sm text-gray-600">
            Crea una cuenta gratis en 30 segundos
          </p>
        </div>
      </div>

      {/* Preview blur */}
      <div className="space-y-3 mb-4 blur-sm select-none pointer-events-none">
        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="h-4 w-4" />
          <span>{contactPhone || '+54 *** *** ****'}</span>
        </div>
        {contactEmail && (
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="h-4 w-4" />
            <span>{contactEmail || 'contacto@*****.com'}</span>
          </div>
        )}
        {contactName && (
          <div className="flex items-center gap-2 text-gray-700">
            <User className="h-4 w-4" />
            <span>{contactName || '****** ******'}</span>
          </div>
        )}
      </div>

      <Button
        onClick={handleRevealClick}
        className="w-full"
        size="lg"
      >
        <Lock className="h-4 w-4 mr-2" />
        Iniciar sesión / Registrarse
      </Button>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-center text-gray-600 font-medium mb-2">
          ¿Por qué registrarse?
        </p>
        <ul className="space-y-1">
          <li className="text-xs text-gray-600 flex items-start gap-1">
            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Contacto ilimitado con propietarios</span>
          </li>
          <li className="text-xs text-gray-600 flex items-start gap-1">
            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Guarda tus favoritos</span>
          </li>
          <li className="text-xs text-gray-600 flex items-start gap-1">
            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span>100% gratis, sin tarjeta</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
