import { fetchRealProperties } from '@/lib/api'
import { PageTracker } from '@/components/analytics/page-tracker'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Crown, Check } from 'lucide-react'
import { isFounderOfferActive, getFounderSpotsRemaining } from '@/lib/founder-offer-config'

// Import new home components
import {
  HeroSectionNew,
  MissionBanner,
  ValuePropositionSection,
  AllUsersSection,
  CommunityShowcase,
  AgencyWebsiteShowcase,
  ComingSoonSection,
  PropertyGridAdaptive,
  FAQSection
} from '@/components/home'

// Configuración para páginas dinámicas con searchParams
export const dynamic = 'force-dynamic'

// Cache configurado para producción - temporalmente 0 para testing
export const revalidate = 0

// Metadatos dinámicos para SEO
export const metadata: Metadata = {
  title: 'Misiones Arrienda - Propiedades en Alquiler y Venta en Misiones',
  description: 'Encuentra las mejores propiedades en alquiler y venta en Misiones. Casas, departamentos, locales comerciales en Posadas, Oberá, Eldorado y más ciudades.',
  keywords: 'alquiler misiones, venta propiedades misiones, casas posadas, departamentos oberá, inmobiliaria misiones, propiedades eldorado, puerto iguazú',
  openGraph: {
    title: 'Misiones Arrienda - Portal Inmobiliario de Misiones',
    description: 'Descubre propiedades en alquiler y venta en toda la provincia de Misiones. La plataforma inmobiliaria más completa de la región.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Misiones Arrienda',
    images: [
      {
        url: '/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Misiones Arrienda - Propiedades en Misiones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Misiones Arrienda - Propiedades en Misiones',
    description: 'Encuentra tu próxima propiedad en Misiones. Alquiler y venta de casas, departamentos y locales.',
    images: ['/og-home.jpg'],
  },
  alternates: {
    canonical: 'https://misionesarrienda.com.ar',
  },
}

// Función para obtener propiedades en el servidor
async function getInitialProperties() {
  try {
    const properties = await fetchRealProperties({ limit: 6, featured: true })
    return properties
  } catch (error) {
    // Error ya logueado en api.ts
    return []
  }
}

// Definir tipos para searchParams
type SearchParams = { [key: string]: string | string[] | undefined }

interface HomePageProps {
  searchParams: SearchParams
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Detectar sesión
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener propiedades destacadas para renderizado inicial
  const initialProperties = await getInitialProperties()

  // Obtener información del usuario si está logueado
  let userData = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('user_type, is_founder')
      .eq('id', user.id)
      .single()
    userData = data
  }

  // Landing pública (sin sesión)
  if (!user) {
    return (
      <main className="min-h-screen" data-testid="public-landing">
        <PageTracker eventName="visit_home_public" />

        {/* Hero Section with Dual Search */}
        <HeroSectionNew />

        {/* Mission Banner */}
        <MissionBanner />

        {/* Value Proposition */}
        <ValuePropositionSection />

        {/* All Users Section */}
        <AllUsersSection />

        {/* Community Showcase */}
        <CommunityShowcase />

        {/* Agency Website Showcase */}
        <AgencyWebsiteShowcase />

        {/* Properties Adaptive Grid */}
        <PropertyGridAdaptive properties={initialProperties} />

        {/* Coming Soon Roadmap */}
        <ComingSoonSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Final */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">¿Listo para encontrar tu próximo hogar?</h2>
            <p className="text-xl mb-8">Creá tu cuenta gratis y accedé a todas las funcionalidades</p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Comenzar ahora
              </Button>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  // Feed real (usuario logueado)
  const isAgency = userData?.user_type?.toUpperCase() === 'INMOBILIARIA' || userData?.user_type?.toUpperCase() === 'AGENCY'
  const isFounder = userData?.is_founder === true
  const showFounderBanner = isAgency && !isFounder && isFounderOfferActive()

  return (
    <main className="min-h-screen">
      <PageTracker eventName="visit_home" />

      {/* Hero Section with Dual Search */}
      <HeroSectionNew />

      {/* Mission Banner */}
      <MissionBanner />

      {/* Banner Oferta Fundadores - Solo para inmobiliarias NO fundadoras Y si la oferta está activa */}
      {showFounderBanner && (
        <section className="py-8 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-white opacity-10"></div>

              <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-6 h-6" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Oferta Exclusiva para Inmobiliarias</span>
                </div>

                <h2 className="text-3xl font-bold mb-4">Sé uno de los 15 Miembros Fundadores</h2>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">12 meses GRATIS</p>
                      <p className="text-blue-100 text-sm">Plan Profesional completo (valor: $330,000)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">50% descuento permanente</p>
                      <p className="text-blue-100 text-sm">$13,750/mes después del año gratis</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Badge "Fundador"</p>
                      <p className="text-blue-100 text-sm">Permanente en tu perfil público</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between flex-wrap">
                  <div>
                    <p className="text-sm text-blue-100">
                      ⏰ Solo quedan <span className="font-bold text-white text-xl">{getFounderSpotsRemaining()}</span> lugares disponibles
                    </p>
                  </div>
                  <Link href="/mi-empresa/planes">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-xl">
                      Ver Planes y Beneficios
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Properties with search filters */}
      <PropertyGridAdaptive properties={initialProperties} />
      
      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Misiones Arrienda",
            "description": "Portal inmobiliario de Misiones para alquiler y venta de propiedades",
            "url": "https://misionesarrienda.com.ar",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://misionesarrienda.com.ar/buscar?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "areaServed": {
              "@type": "State",
              "name": "Misiones, Argentina"
            },
            "serviceArea": {
              "@type": "GeoCircle",
              "geoMidpoint": {
                "@type": "GeoCoordinates",
                "latitude": -27.3621,
                "longitude": -55.9008
              },
              "geoRadius": "200000"
            }
          })
        }}
      />
    </main>
  )
}
