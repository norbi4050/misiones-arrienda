import { Metadata } from 'next'
import { getProperties } from '@/lib/api'
import { PropertyGridServer } from '@/components/property-grid-server'

// Configuración para páginas dinámicas con searchParams
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Propiedades en Oberá, Misiones | Alquiler y Venta - Misiones Arrienda',
  description: 'Encuentra las mejores propiedades en alquiler y venta en Oberá, Misiones. La capital nacional de la yerba mate ofrece excelentes oportunidades inmobiliarias.',
  keywords: 'obera misiones, alquiler obera, venta propiedades obera, casas obera, departamentos obera, inmobiliaria obera, yerba mate',
  openGraph: {
    title: 'Propiedades en Oberá, Misiones - Misiones Arrienda',
    description: 'Descubre propiedades en alquiler y venta en Oberá, la capital nacional de la yerba mate en Misiones.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Misiones Arrienda',
    images: [
      {
        url: '/og-obera.jpg',
        width: 1200,
        height: 630,
        alt: 'Propiedades en Oberá, Misiones',
      },
    ],
  },
  alternates: {
    canonical: 'https://misionesarrienda.com.ar/obera',
  },
}

async function getOberaProperties() {
  try {
    const response = await getProperties({ city: 'Oberá', limit: 12 })
    return response.properties
  } catch (error) {
    console.error('Error fetching Oberá properties:', error)
    return []
  }
}

// Definir tipos para searchParams
type SearchParams = { [key: string]: string | string[] | undefined }

interface OberaPageProps {
  searchParams: SearchParams
}

export default async function OberaPage({ searchParams }: OberaPageProps) {
  const properties = await getOberaProperties()

  return (
    <main className="min-h-screen">
      {/* Hero específico para Oberá */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Propiedades en Oberá, Misiones
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Descubre oportunidades inmobiliarias en la capital nacional de la yerba mate. 
            Una ciudad próspera con gran calidad de vida y crecimiento constante.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">🧉 Capital de la Yerba Mate</h3>
              <p>Centro de la industria yerbatera argentina</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">🌿 Ciudad Verde</h3>
              <p>Rodeada de naturaleza y plantaciones</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">🏭 Polo Industrial</h3>
              <p>Importante centro económico de la región</p>
            </div>
          </div>
        </div>
      </section>

      {/* Información local */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">¿Por qué invertir en Oberá?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold mb-4">🧉 Capital Nacional de la Yerba Mate</h3>
                <p className="text-gray-700">
                  Oberá es reconocida como la capital nacional de la yerba mate, 
                  con una economía sólida basada en esta industria tradicional.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🎭 Festival Nacional de la Yerba Mate</h3>
                <p className="text-gray-700">
                  Cada año, la ciudad se convierte en el centro de atención nacional 
                  con su famoso festival que atrae miles de visitantes.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🏫 Centro Educativo Regional</h3>
                <p className="text-gray-700">
                  Importante centro educativo con instituciones de nivel superior 
                  y técnico que atraen estudiantes de toda la región.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🌱 Crecimiento Sostenible</h3>
                <p className="text-gray-700">
                  Ciudad en constante crecimiento con desarrollo urbano planificado 
                  y respeto por el medio ambiente.
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
            Propiedades Disponibles en Oberá
          </h2>
          <PropertyGridServer 
            initialProperties={properties} 
            searchParams={searchParams}
          />
        </div>
      </section>

      {/* JSON-LD para SEO local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Propiedades en Oberá, Misiones",
            "description": "Propiedades en alquiler y venta en Oberá, capital nacional de la yerba mate",
            "url": "https://misionesarrienda.com.ar/obera",
            "about": {
              "@type": "Place",
              "name": "Oberá",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Oberá",
                "addressRegion": "Misiones",
                "addressCountry": "AR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -27.4878,
                "longitude": -55.1199
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
