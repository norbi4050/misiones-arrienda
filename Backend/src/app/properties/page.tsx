import { Suspense } from 'react'
import { Metadata } from 'next'
import { PropertiesPageClient } from './properties-client-new'
import { PageTracker } from '@/components/analytics/page-tracker'
import { createClient } from '@/lib/supabase/server'
import { fetchRealProperties } from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, MapPin, MessageCircle, Search, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Propiedades en Alquiler y Venta - Misiones | MisionesArrienda',
  description: 'Encuentra la propiedad perfecta en Misiones. Casas, departamentos, locales comerciales y terrenos en alquiler y venta en Posadas, Oberá, Puerto Iguazú y más ciudades.',
  keywords: 'propiedades Misiones, alquiler Posadas, venta casas Oberá, departamentos Puerto Iguazú, inmobiliaria Misiones',
  openGraph: {
    title: 'Propiedades en Misiones - Alquiler y Venta',
    description: 'Explora miles de propiedades en Misiones con filtros avanzados. Encuentra tu hogar ideal.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Misiones Arrienda',
    url: 'https://www.misionesarrienda.com.ar/properties',
    images: [
      {
        url: '/placeholder-apartment-1.jpg',
        width: 1200,
        height: 630,
        alt: 'Propiedades en Misiones - Alquiler y Venta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Propiedades en Misiones - Alquiler y Venta',
    description: 'Explora miles de propiedades en Misiones con filtros avanzados. Encuentra tu hogar ideal.',
    images: ['/placeholder-apartment-1.jpg'],
  },
  alternates: {
    canonical: 'https://www.misionesarrienda.com.ar/properties',
  },
}

async function getDemoProperties() {
  try {
    const properties = await fetchRealProperties({ limit: 6, featured: true })
    return properties
  } catch (error) {
    console.error('Error fetching demo properties:', error)
    return []
  }
}

export default async function PropertiesPage() {
  // Detectar sesión
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Landing pública (sin sesión)
  if (!user) {
    const demoProperties = await getDemoProperties()

    return (
      <main className="min-h-screen" data-testid="public-landing">
        <PageTracker eventName="visit_properties_public" />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Miles de propiedades en Misiones
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Alquiler y venta de casas, departamentos y locales en Posadas, Oberá, Eldorado y toda la provincia
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Ver todas las propiedades
              </Button>
            </Link>
          </div>
        </section>

        {/* Highlights */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Beneficios de la plataforma</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Alquiler y Venta</h3>
                  <p className="text-gray-600">
                    Accedé a miles de propiedades en alquiler y venta. Casas, departamentos, locales y terrenos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Contacto Directo</h3>
                  <p className="text-gray-600">
                    Hablá directamente con los dueños. Sin intermediarios ni comisiones ocultas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Filtros Avanzados</h3>
                  <p className="text-gray-600">
                    Filtrá por ubicación, precio, tipo de propiedad y más. Encontrá exactamente lo que buscás.
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
              {demoProperties.slice(0, 6).map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
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
                  Crear cuenta para ver más
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // Feed real (usuario logueado)
  return (
    <>
      <PageTracker eventName="visit_properties" />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando propiedades...</p>
          </div>
        </div>
      }>
        <PropertiesPageClient />
      </Suspense>
    </>
  )
}
