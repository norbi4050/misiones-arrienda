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
import { Home, MapPin, MessageCircle, Search, Shield, TrendingUp, Clock, Star, CheckCircle, Building2, Key } from 'lucide-react'

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
    // Error ya logueado en api.ts
    return []
  }
}

export default async function PropertiesPage() {
  // Detectar sesión
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ========================================
  // FEATURE: Public Property Listing
  // Verificar si el listado público está habilitado
  // ========================================
  const publicListingEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_LISTING === 'true'

  // Landing pública (sin sesión) - SOLO SI FEATURE FLAG ESTÁ OFF
  if (!user && !publicListingEnabled) {
    const demoProperties = await getDemoProperties()

    return (
      <main className="min-h-screen bg-gray-50" data-testid="public-landing">
        <PageTracker eventName="visit_properties_public" />

        {/* Hero Section - Mejorado */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-24 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Portal Inmobiliario Oficial de Misiones</span>
              </div>

              <h1 className="text-6xl font-bold mb-6 leading-tight">
                Encontrá tu hogar ideal
                <span className="block text-blue-200 mt-2">en Misiones</span>
              </h1>

              <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                Miles de propiedades en alquiler y venta. Casas, departamentos, locales comerciales y terrenos
                en Posadas, Oberá, Eldorado y toda la provincia.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register" prefetch={false}>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 shadow-2xl">
                    <Search className="w-5 h-5 mr-2" />
                    Explorar propiedades
                  </Button>
                </Link>
                <Link href="/register?type=owner" prefetch={false}>
                  <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                    <Key className="w-5 h-5 mr-2" />
                    Publicar propiedad
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-blue-200">Propiedades activas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm text-blue-200">Ciudades</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">1000+</div>
                  <div className="text-sm text-blue-200">Usuarios activos</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase - Mejorado */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">¿Por qué elegir Misiones Arrienda?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                La plataforma más completa y confiable para encontrar tu próximo hogar en Misiones
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="border-2 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-transform">
                    <Home className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Miles de opciones</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Casas, departamentos, locales comerciales y terrenos en toda la provincia.
                    Encontrá el espacio perfecto para vos.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-green-300 hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-transform">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">100% Seguro</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Verificación de propiedades y dueños. Protegemos tu información personal
                    y garantizamos transacciones seguras.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-transform">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Contacto directo</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Chateá directamente con los dueños e inmobiliarias. Sin intermediarios,
                    sin comisiones ocultas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works Section - Nuevo */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Cómo funciona</h2>
              <p className="text-xl text-gray-600">Encontrá tu hogar en 3 simples pasos</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Buscá y filtrá</h3>
                <p className="text-gray-600">
                  Usá nuestros filtros avanzados para encontrar propiedades que se ajusten
                  a tu presupuesto y preferencias.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Contactá</h3>
                <p className="text-gray-600">
                  Chateá con los dueños, coordiná visitas y hacé todas las preguntas
                  que necesites desde la plataforma.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Mudáte</h3>
                <p className="text-gray-600">
                  Cerrá el trato con confianza y empezá a disfrutar de tu nuevo hogar
                  en Misiones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Properties - Mejorado */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Propiedades Destacadas</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Descubrí las mejores oportunidades del momento en Misiones
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {demoProperties.slice(0, 6).map((property) => (
                <Card key={property.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300">
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    {property.images?.[0] && (
                      <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    {property.featured && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Star className="w-4 h-4 fill-white" />
                        Destacada
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-sm">{property.city}, Misiones</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-3xl font-bold text-blue-600">
                          ${property.price?.toLocaleString('es-AR')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{property.currency || 'ARS'}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{property.bedrooms} hab</div>
                        <div>{property.bathrooms} baños</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Auth Wall - Mejorado */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent h-32 -mt-32 pointer-events-none"></div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border-2 border-blue-200">
                <h3 className="text-3xl font-bold mb-4">¿Querés ver más propiedades?</h3>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Creá tu cuenta gratis y accedé a cientos de propiedades exclusivas en toda la provincia
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link href="/register" prefetch={false}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-10 py-6 shadow-xl">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Crear cuenta gratis
                    </Button>
                  </Link>
                  <Link href="/login" prefetch={false}>
                    <Button size="lg" variant="outline" className="text-lg px-10 py-6">
                      Ya tengo cuenta
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                  ✓ Sin costo • ✓ Sin comisiones • ✓ Acceso instantáneo
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - Mejorado */}
        <section className="relative py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-5xl font-bold mb-6">¿Listo para encontrar tu hogar?</h2>
            <p className="text-2xl mb-10 text-blue-100 max-w-3xl mx-auto">
              Unite a miles de personas que ya encontraron su lugar ideal en Misiones
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link href="/register" prefetch={false}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-xl px-12 py-8 shadow-2xl">
                  Comenzar ahora
                </Button>
              </Link>
              <Link href="/comunidad" prefetch={false}>
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-xl px-12 py-8">
                  Ver comunidad
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 pt-12 border-t border-white/20">
              <div>
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Registro gratis</p>
              </div>
              <div>
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Sin comisiones</p>
              </div>
              <div>
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">100% seguro</p>
              </div>
              <div>
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Soporte 24/7</p>
              </div>
            </div>
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
