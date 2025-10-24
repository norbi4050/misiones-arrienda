import { Suspense } from 'react'
import { Metadata } from 'next'
import Image from 'next/image'
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

async function getPublicProperties() {
  try {
    console.log('[getPublicProperties] START - Fetching properties directly from Supabase...')

    // Llamar directamente a Supabase en lugar de hacer HTTP fetch
    const supabase = createClient()
    const { data, error } = await supabase
      .from('Property')
      .select('*')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('createdAt', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[getPublicProperties] Supabase error:', error)
      return []
    }

    console.log('[getPublicProperties] RESULT - Got properties:', data?.length || 0)

    // Parsear el campo images que viene como JSON string
    const processedData = data?.map(property => {
      let images = [];
      try {
        if (typeof property.images === 'string') {
          images = JSON.parse(property.images);
        } else if (Array.isArray(property.images)) {
          images = property.images;
        }
      } catch (e) {
        console.error('[getPublicProperties] Error parsing images:', e);
        images = [];
      }

      return {
        ...property,
        images
      };
    }) || [];

    return processedData
  } catch (error) {
    console.error('[getPublicProperties] CATCH - Error:', error)
    return []
  }
}

export default async function PropertiesPage() {
  // ========================================
  // FEATURE: Public Property Listing
  // Verificar si el listado público está habilitado
  // ========================================
  const publicListingEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_LISTING === 'true'

  // Detectar sesión SOLO si es necesario
  let user = null
  if (publicListingEnabled) {
    // Si el feature flag está activado, necesitamos checkear auth
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    } catch (error) {
      console.error('[PropertiesPage] Auth check failed:', error)
      // En caso de error, asumir usuario anónimo
      user = null
    }
  }

  // Landing pública (sin sesión) - SOLO SI FEATURE FLAG ESTÁ OFF
  if (!user && !publicListingEnabled) {
    const publicProperties = await getPublicProperties()

    return (
      <main className="min-h-screen bg-gray-50" data-testid="public-landing">
        <PageTracker eventName="visit_properties_public" />

        {/* Hero Section - Simple como comunidad */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Alquilá o vendé sin comisiones
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {publicProperties.length > 0
                ? `${publicProperties.length} propiedades disponibles en Misiones. Casas, departamentos, locales y terrenos.`
                : 'Casas, departamentos, locales y terrenos en toda la provincia de Misiones.'
              }
            </p>
            <Link href="/register" prefetch={false}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Ver todas las propiedades
              </Button>
            </Link>
          </div>
        </section>

        {/* Highlights - Simple como comunidad */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Beneficios de la plataforma</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Miles de Opciones</h3>
                  <p className="text-gray-600">
                    Casas, departamentos, locales comerciales y terrenos en toda la provincia.
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

        {/* Propiedades Disponibles - Como comunidad */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Propiedades Disponibles</h2>

            {/* Properties Grid */}
            {publicProperties.length > 0 ? (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {publicProperties.slice(0, 12).map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-gray-200 relative">
                        {property.images?.[0] && (
                          <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            loading="lazy"
                          />
                        )}
                        {property.featured && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            Destacada
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {property.city}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-blue-600">
                            ${property.price?.toLocaleString('es-AR')}
                          </p>
                          <div className="text-xs text-gray-500">
                            {property.bedrooms} hab • {property.bathrooms} baños
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* CTA to see more */}
                {publicProperties.length > 12 && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      {publicProperties.length - 12} propiedades más disponibles
                    </p>
                    <Link href="/register" prefetch={false}>
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                        Registrate para ver todas ({publicProperties.length} propiedades)
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No hay propiedades disponibles en este momento</p>
                <Link href="/register" prefetch={false}>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Registrate para recibir notificaciones
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    )
  }

  // Feed real (usuario logueado O feature flag activado)
  // Con feature flag activado, pasamos isAuthenticated al cliente
  return (
    <>
      <PageTracker eventName={user ? "visit_properties" : "visit_properties_public"} />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando propiedades...</p>
          </div>
        </div>
      }>
        <PropertiesPageClient
          isAuthenticated={!!user}
          userId={user?.id}
        />
      </Suspense>
    </>
  )
}
