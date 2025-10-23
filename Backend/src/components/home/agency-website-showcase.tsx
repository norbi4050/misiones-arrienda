"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Check, Crown, Globe } from 'lucide-react'
import { isFounderOfferActive, getFounderSpotsRemaining, getFounderOfferTotalValue, FOUNDER_OFFER_CONFIG } from '@/lib/founder-offer-config'

export function AgencyWebsiteShowcase() {
  const showFounderOffer = isFounderOfferActive()
  const spotsRemaining = getFounderSpotsRemaining()
  const offerValue = getFounderOfferTotalValue()

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white relative overflow-hidden">
      {/* Decoraciones de fondo */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-5"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-white opacity-5"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Columna Izquierda: Texto */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-8 h-8" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Para Inmobiliarias
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Obtené tu Sitio Web Profesional
            </h2>

            <p className="text-xl text-blue-100 mb-8">
              No necesitás pagar miles de pesos por un sitio web. Al registrarte, automáticamente obtenés:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Tu página web personalizada</p>
                  <p className="text-blue-100 text-sm">
                    misionesarrienda.com.ar/inmobiliaria/<strong>tu-marca</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Destacá propiedades ilimitadas</p>
                  <p className="text-blue-100 text-sm">Aparecé primero en las búsquedas</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Tracking de visitas en tiempo real</p>
                  <p className="text-blue-100 text-sm">Sabé cuántas personas ven tus propiedades</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Mensajería integrada con clientes</p>
                  <p className="text-blue-100 text-sm">Todo en un solo lugar</p>
                </div>
              </div>
            </div>

            {/* Oferta Fundadores - Solo si está activa */}
            {showFounderOffer && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-bold uppercase">Oferta Fundadores</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div>
                    <p className="text-3xl font-bold">{FOUNDER_OFFER_CONFIG.freeMonths} meses</p>
                    <p className="text-sm text-blue-100">GRATIS</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{FOUNDER_OFFER_CONFIG.discountPercent}% OFF</p>
                    <p className="text-sm text-blue-100">permanente después</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-100">
                    Valor total: <span className="font-bold text-white line-through">${offerValue.toLocaleString('es-AR')}</span>
                  </p>
                  <p className="text-xs text-blue-200 mt-2">
                    ⏰ Solo quedan <strong className="text-white text-base">{spotsRemaining}</strong> lugares disponibles
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/mi-empresa/planes" className="flex-1" prefetch={false}>
                <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg">
                  {showFounderOffer ? 'Ver Planes Fundadores →' : 'Ver Planes →'}
                </Button>
              </Link>
              <Link href="/inmobiliaria/register" className="flex-1" prefetch={false}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-white text-white hover:bg-white/10"
                >
                  Registrarme Ahora
                </Button>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Mockup de sitio web */}
          <div className="relative">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform">
              {/* Browser mockup */}
              <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600 flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  misionesarrienda.com.ar/inmobiliaria/tu-empresa
                </div>
              </div>

              {/* Screenshot placeholder - diseño simple */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
                <div className="space-y-4">
                  {/* Header ficticio */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-300">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="h-4 bg-gray-800 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-400 rounded w-24"></div>
                    </div>
                  </div>

                  {/* Grid de propiedades ficticias */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg shadow h-32 overflow-hidden">
                      <div className="h-20 bg-gray-300"></div>
                      <div className="p-2">
                        <div className="h-2 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow h-32 overflow-hidden">
                      <div className="h-20 bg-gray-300"></div>
                      <div className="p-2">
                        <div className="h-2 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>

                  {/* CTA ficticio */}
                  <div className="h-10 bg-blue-600 rounded-lg shadow"></div>
                </div>
              </div>
            </div>

            {/* Badge flotante */}
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 rounded-full px-4 py-2 font-bold shadow-lg transform rotate-12">
              ¡INCLUIDO!
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
