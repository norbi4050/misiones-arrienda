import { Metadata } from 'next'
import { getProperties } from '@/lib/api'
import { PropertyGrid } from '@/components/property-grid'
import { HeroSection } from '@/components/hero-section'

export const metadata: Metadata = {
  title: 'Propiedades en Posadas, Misiones | Alquiler y Venta - Misiones Arrienda',
  description: 'Encuentra las mejores propiedades en alquiler y venta en Posadas, Misiones. Casas, departamentos y locales comerciales en el centro de la capital misionera.',
  keywords: 'posadas misiones, alquiler posadas, venta propiedades posadas, casas posadas, departamentos posadas, inmobiliaria posadas',
  openGraph: {
    title: 'Propiedades en Posadas, Misiones - Misiones Arrienda',
    description: 'Descubre propiedades en alquiler y venta en Posadas, la capital de Misiones. La mejor selección inmobiliaria de la ciudad.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Misiones Arrienda',
    images: [
      {
        url: '/og-posadas.jpg',
        width: 1200,
        height: 630,
        alt: 'Propiedades en Posadas, Misiones',
      },
    ],
  },
  alternates: {
    canonical: 'https://misionesarrienda.com.ar/posadas',
  },
}

async function getPosadasProperties() {
  try {
    const response = await getProperties({ city: 'Posadas', limit: 12 })
    return response.properties
  } catch (error) {
    console.error('Error fetching Posadas properties:', error)
    return []
  }
}

export default async function PosadasPage() {
  const properties = await getPosadasProperties()

  return (
    <main className="min-h-screen">
      {/* Hero específico para Posadas */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Propiedades en Posadas, Misiones
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Descubre las mejores oportunidades inmobiliarias en la capital de Misiones.
            Casas, departamentos y locales comerciales en el corazón de la provincia.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">Centro Histórico</h3>
              <p>Propiedades en el corazón comercial y cultural de Posadas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">Zona Costanera</h3>
              <p>Vistas al río Paraná y acceso a la costanera</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">Barrios Residenciales</h3>
              <p>Zonas tranquilas ideales para familias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Información local */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">¿Por qué elegir Posadas?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold mb-4">🏛️ Capital Provincial</h3>
                <p className="text-gray-700">
                  Como capital de Misiones, Posadas ofrece todas las comodidades urbanas,
                  servicios públicos de calidad y oportunidades laborales.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🌊 Costanera del Río Paraná</h3>
                <p className="text-gray-700">
                  Disfruta de una de las costaneras más hermosas del país,
                  perfecta para recreación y actividades al aire libre.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🎓 Centro Educativo</h3>
                <p className="text-gray-700">
                  Universidad Nacional de Misiones y múltiples instituciones
                  educativas de todos los niveles.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🛒 Centro Comercial</h3>
                <p className="text-gray-700">
                  Amplia oferta comercial, desde centros comerciales modernos
                  hasta el tradicional mercado de la ciudad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Propiedades */}
      <section id="propiedades" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Propiedades Disponibles en Posadas
          </h2>
          <PropertyGrid initialProperties={properties} />
        </div>
      </section>

      {/* JSON-LD para SEO local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Propiedades en Posadas, Misiones",
            "description": "Propiedades en alquiler y venta en Posadas, capital de Misiones",
            "url": "https://misionesarrienda.com.ar/posadas",
            "about": {
              "@type": "Place",
              "name": "Posadas",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Posadas",
                "addressRegion": "Misiones",
                "addressCountry": "AR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -27.3621,
                "longitude": -55.9008
              }
            },
            "provider": {
              "@type": "Organization",
              "name": "Misiones Arrienda",
              "url": "https://misionesarrienda.com.ar"
            }
          })
        }}
      />
    </main>
  )
}
