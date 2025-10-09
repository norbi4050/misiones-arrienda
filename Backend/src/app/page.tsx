import { HeroSection } from '@/components/hero-section'
import { PropertyGridServer } from '@/components/property-grid-server'
import { fetchRealProperties } from '@/lib/api'
import { PageTracker } from '@/components/analytics/page-tracker'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, Search, Sparkles, Home, MapPin, Users } from 'lucide-react'

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
    console.error('Error fetching initial properties:', error)
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

  // Landing pública (sin sesión)
  if (!user) {
    return (
      <main className="min-h-screen" data-testid="public-landing">
        <PageTracker eventName="visit_home_public" />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Encontrá tu hogar ideal en Misiones
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              La plataforma más completa para alquilar, comprar y compartir vivienda en toda la provincia
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Crear cuenta gratis
              </Button>
            </Link>
          </div>
        </section>

        {/* Highlights */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">¿Por qué elegir Misiones Arrienda?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Búsqueda Local Optimizada</h3>
                  <p className="text-gray-600">
                    Filtrá por ciudad, barrio, precio y características. Encontrá exactamente lo que buscás en Posadas, Oberá, Eldorado y más.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Mensajería Interna Segura</h3>
                  <p className="text-gray-600">
                    Contactá directamente con dueños e inquilinos. Sin intermediarios, sin comisiones ocultas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Asistente IA</h3>
                  <p className="text-gray-600">
                    Nuestro asistente inteligente te ayuda a encontrar la propiedad perfecta según tus necesidades.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Properties */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Propiedades Destacadas</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {initialProperties.slice(0, 6).map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 relative">
                    {property.images?.[0] && (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.city}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      ${property.price?.toLocaleString('es-AR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Ver todas las propiedades
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">¿Listo para encontrar tu próximo hogar?</h2>
            <p className="text-xl mb-8">Creá tu cuenta gratis y accedé a miles de propiedades</p>
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
  return (
    <main className="min-h-screen">
      <PageTracker eventName="visit_home" />
      <HeroSection />
      <section id="propiedades">
        <PropertyGridServer 
          initialProperties={initialProperties} 
          searchParams={searchParams}
        />
      </section>
      
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
