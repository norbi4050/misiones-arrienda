'use client'

import { Crown, Sparkles, TrendingUp, Users, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface FounderWelcomeBannerProps {
  companyName: string
  planEndDate?: string | null
}

export default function FounderWelcomeBanner({ companyName, planEndDate }: FounderWelcomeBannerProps) {
  // Calcular días restantes del período gratis
  const daysRemaining = planEndDate
    ? Math.ceil((new Date(planEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const showFreePeriod = daysRemaining && daysRemaining > 0

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 p-6 mb-6">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-amber-200 opacity-20"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-yellow-200 opacity-20"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full p-3 shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                ¡Bienvenido, Miembro Fundador!
              </h2>
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-gray-700">
              Gracias por confiar en <span className="font-semibold">{companyName}</span> y ser parte de los primeros 15 miembros fundadores de Misiones Arrienda.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Plan Profesional</h3>
            </div>
            {showFreePeriod ? (
              <p className="text-sm text-gray-700">
                <span className="font-bold text-green-600">GRATIS</span> por {daysRemaining} días más
              </p>
            ) : (
              <p className="text-sm text-gray-700">
                <span className="font-bold text-green-600">50% OFF</span> de por vida
              </p>
            )}
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-amber-100 rounded-full p-2">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Badge Exclusivo</h3>
            </div>
            <p className="text-sm text-gray-700">
              "Miembro Fundador" <span className="font-semibold">permanente</span> en tu perfil
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 rounded-full p-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Comunidad Elite</h3>
            </div>
            <p className="text-sm text-gray-700">
              Parte de los <span className="font-semibold">primeros 15</span> en toda Misiones
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Tu opinión es valiosa</p>
              <p className="text-sm text-amber-50">
                Como fundador, tenés acceso prioritario a nuevas funciones y tu feedback nos ayuda a mejorar la plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
