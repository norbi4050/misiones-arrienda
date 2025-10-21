"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Check, Crown, Star, ArrowLeft, Sparkles, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UserPlanInfo {
  id: string
  email: string
  company_name: string | null
  is_founder: boolean
  founder_discount: number | null
  plan_tier: string | null
  plan_start_date: string | null
  plan_end_date: string | null
  created_at: string
}

interface PlanesClientProps {
  userPlanInfo: UserPlanInfo
}

export default function PlanesClient({ userPlanInfo }: PlanesClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(userPlanInfo.plan_tier || 'free')

  // Calcular si el plan está activo o expirado
  const isPlanActive = userPlanInfo.plan_end_date
    ? new Date(userPlanInfo.plan_end_date) > new Date()
    : true // Si no hay fecha de fin, está activo (free o fundador permanente)

  // Calcular días restantes del plan
  const daysRemaining = userPlanInfo.plan_end_date
    ? Math.ceil((new Date(userPlanInfo.plan_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceLabel: 'Gratis',
      description: 'Perfecto para comenzar',
      icon: Star,
      color: 'gray',
      features: [
        'Hasta 5 propiedades activas',
        'Sitio web básico propio',
        'Publicación en marketplace',
        'Mensajería con clientes',
        'Panel de control',
      ],
      notIncluded: [
        'Sin estadísticas avanzadas',
        'Sin propiedades destacadas',
        'Sin prioridad en búsquedas',
        'Sin soporte prioritario',
      ]
    },
    {
      id: 'professional',
      name: 'Profesional',
      price: 27500,
      priceLabel: '$27,500',
      description: 'Ideal para inmobiliarias en crecimiento',
      icon: Crown,
      color: 'blue',
      recommended: true,
      features: [
        'Hasta 20 propiedades activas',
        'Sitio web personalizado',
        '3 destacados por mes',
        'Estadísticas avanzadas',
        'Soporte prioritario',
        'Posicionamiento +30%',
        'Acceso a nuevas funciones',
        'Analytics detallado',
      ],
      founderOffer: {
        months: 12,
        discount: 50,
        message: '12 meses GRATIS para fundadores'
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 50000,
      priceLabel: '$50,000',
      description: 'Para inmobiliarias establecidas',
      icon: Award,
      color: 'purple',
      features: [
        'Propiedades ILIMITADAS',
        '10 destacados por mes',
        'Prioridad máxima (+50%)',
        'Publicidad compartida',
        'Chatbot IA (próximamente)',
        'Traducción automática',
        'Soporte 24/7',
        'Verificación prioritaria',
        'API de integración',
        'Gestor de cuenta dedicado',
      ]
    }
  ]

  const getPlanColor = (color: string) => {
    const colors = {
      gray: 'border-gray-300 bg-gray-50',
      blue: 'border-blue-500 bg-blue-50 shadow-lg scale-105',
      purple: 'border-purple-500 bg-purple-50'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const getButtonColor = (color: string) => {
    const colors = {
      gray: 'bg-gray-600 hover:bg-gray-700',
      blue: 'bg-blue-600 hover:bg-blue-700',
      purple: 'bg-purple-600 hover:bg-purple-700'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/mi-empresa" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mi Empresa
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Planes y Precios</h1>
          <p className="text-lg text-gray-600">Elegí el plan ideal para tu inmobiliaria</p>
        </div>

        {/* Banner Oferta Fundadores */}
        {!userPlanInfo.is_founder && (
          <div className="mb-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-white opacity-10"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-6 h-6" />
                <span className="text-sm font-semibold uppercase tracking-wider">Oferta Exclusiva</span>
              </div>

              <h2 className="text-3xl font-bold mb-3">Miembros Fundadores</h2>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Plan Profesional GRATIS</p>
                    <p className="text-blue-100 text-sm">por 12 meses completos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">50% descuento de por vida</p>
                    <p className="text-blue-100 text-sm">después del primer año</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Badge "Miembro Fundador"</p>
                    <p className="text-blue-100 text-sm">permanente en tu perfil</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm">Valor total</p>
                  <p className="text-2xl font-bold">$330,000</p>
                </div>
                <div className="text-3xl">→</div>
                <div className="bg-white text-blue-600 rounded-lg px-4 py-2">
                  <p className="text-sm font-semibold">Para ti</p>
                  <p className="text-2xl font-bold">GRATIS</p>
                </div>
              </div>

              <p className="text-sm text-blue-100 mt-4">
                ⏰ Solo quedan <span className="font-bold text-white">12 lugares</span> disponibles
              </p>
            </div>
          </div>
        )}

        {/* Plan Actual del Usuario */}
        {userPlanInfo.is_founder && (
          <div className="mb-8 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-500 rounded-full p-3">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  Sos Miembro Fundador
                  <span className="text-sm font-normal bg-amber-500 text-white px-3 py-1 rounded-full">
                    FUNDADOR
                  </span>
                </h3>
                <p className="text-gray-700 mb-3">
                  {daysRemaining && daysRemaining > 0
                    ? `Te quedan ${daysRemaining} días de tu plan Profesional GRATIS`
                    : 'Disfrutás de 50% de descuento permanente'
                  }
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Plan actual</p>
                    <p className="font-semibold">Profesional</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Descuento</p>
                    <p className="font-semibold">{userPlanInfo.founder_discount}% de por vida</p>
                  </div>
                  {userPlanInfo.plan_start_date && (
                    <div>
                      <p className="text-gray-600">Inicio</p>
                      <p className="font-semibold">{new Date(userPlanInfo.plan_start_date).toLocaleDateString('es-AR')}</p>
                    </div>
                  )}
                  {userPlanInfo.plan_end_date && (
                    <div>
                      <p className="text-gray-600">Próximo pago</p>
                      <p className="font-semibold">{new Date(userPlanInfo.plan_end_date).toLocaleDateString('es-AR')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = userPlanInfo.plan_tier === plan.id
            const showFounderPrice = userPlanInfo.is_founder && plan.id === 'professional'

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border-2 p-8 transition-all duration-200',
                  getPlanColor(plan.color),
                  plan.recommended && 'md:-mt-4 md:mb-4'
                )}
              >
                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      ⭐ RECOMENDADO
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      TU PLAN
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                  plan.color === 'gray' && 'bg-gray-200',
                  plan.color === 'blue' && 'bg-blue-600',
                  plan.color === 'purple' && 'bg-purple-600'
                )}>
                  <Icon className={cn(
                    'w-6 h-6',
                    plan.color === 'gray' ? 'text-gray-600' : 'text-white'
                  )} />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {showFounderPrice ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-bold text-gray-400 line-through">{plan.priceLabel}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-green-600">GRATIS</span>
                        <span className="text-gray-600">por 12 meses</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Luego $13,750/mes (50% off)
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">{plan.priceLabel}</span>
                        {plan.price > 0 && <span className="text-gray-600">/mes</span>}
                      </div>
                      {userPlanInfo.is_founder && plan.price > 0 && (
                        <p className="text-sm text-green-600 font-semibold mt-1">
                          ${(plan.price * 0.5).toLocaleString('es-AR')}/mes con tu descuento fundador
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded?.map((feature, idx) => (
                    <li key={`not-${idx}`} className="flex items-start gap-3 opacity-50">
                      <span className="text-gray-400 flex-shrink-0 mt-0.5">✗</span>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={cn(
                    'w-full font-semibold',
                    getButtonColor(plan.color),
                    isCurrentPlan && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={isCurrentPlan}
                  onClick={() => {
                    if (plan.id === 'professional') {
                      window.location.href = 'mailto:contacto@misionesarrienda.com.ar?subject=Quiero ser Miembro Fundador'
                    }
                  }}
                >
                  {isCurrentPlan
                    ? 'Plan Actual'
                    : plan.id === 'professional' && !userPlanInfo.is_founder
                    ? 'Solicitar lugar de Fundador'
                    : plan.id === 'free'
                    ? 'Plan Actual'
                    : 'Contactar'
                  }
                </Button>

                {/* Founder Offer Label */}
                {plan.founderOffer && !userPlanInfo.is_founder && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-blue-600 font-semibold">
                      🎁 {plan.founderOffer.message}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas Frecuentes</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¿Qué pasa después de los 12 meses gratis?</h3>
              <p className="text-gray-600 text-sm">
                Podés cancelar cuando quieras sin penalidades. Si decidís continuar, pagás $13,750/mes (50% de descuento permanente).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¿Puedo cambiar de plan?</h3>
              <p className="text-gray-600 text-sm">
                Sí, podés actualizar o bajar de plan en cualquier momento. Los fundadores mantienen su descuento del 50%.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¿Qué incluye el sitio web propio?</h3>
              <p className="text-gray-600 text-sm">
                Cada inmobiliaria tiene su subdominio (tuempresa.misionesarrienda.com.ar) personalizable con logo, colores y equipo.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¿Hay contrato de permanencia?</h3>
              <p className="text-gray-600 text-sm">
                No. Podés cancelar cuando quieras, sin penalidades ni contratos a largo plazo.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">¿Tenés dudas sobre qué plan elegir?</p>
          <Button
            variant="outline"
            onClick={() => window.location.href = 'mailto:contacto@misionesarrienda.com.ar'}
          >
            Contactanos
          </Button>
        </div>
      </div>
    </div>
  )
}
