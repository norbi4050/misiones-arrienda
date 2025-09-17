import { Metadata } from 'next'
import { getProperties } from '@/lib/api'
import { PropertyGrid } from '@/components/property-grid'

export const metadata: Metadata = {
  title: 'Propiedades en Puerto Iguazú, Misiones | Alquiler y Venta - Misiones Arrienda',
  description: 'Encuentra las mejores propiedades en alquiler y venta en Puerto Iguazú, Misiones. La puerta de entrada a las Cataratas del Iguazú ofrece excelentes oportunidades de inversión.',
  keywords: 'puerto iguazu misiones, alquiler puerto iguazu, venta propiedades puerto iguazu, cataratas iguazu, turismo misiones, inversion inmobiliaria',
  openGraph: {
    title: 'Propiedades en Puerto Iguazú, Misiones - Misiones Arrienda',
    description: 'Descubre propiedades en alquiler y venta en Puerto Iguazú, la puerta de entrada a las Cataratas del Iguazú.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Misiones Arrienda',
    images: [
      {
        url: '/og-puerto-iguazu.jpg',
        width: 1200,
        height: 630,
        alt: 'Propiedades en Puerto Iguazú, Misiones',
      },
    ],
  },
  alternates: {
    canonical: 'https://misionesarrienda.com.ar/puerto-iguazu',
  },
}

async function getPuertoIguazuProperties() {
  try {
    const response = await getProperties({ city: 'Puerto Iguazú', limit: 12 })
    return response.properties
  } catch (error) {
    console.error('Error fetching Puerto Iguazú properties:', error)
    return []
  }
}

export default async function PuertoIguazuPage() {
  const properties = await getPuertoIguazuProperties()

  return (
    <main className="min-h-screen">
      {/* Hero específico para Puerto Iguazú */}
      <section className="bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Propiedades en Puerto Iguazú, Misiones
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Invierte en la puerta de entrada a una de las Siete Maravillas Naturales del Mundo.
            Puerto Iguazú ofrece oportunidades únicas en el sector turístico e inmobiliario.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">🌊 Cataratas del Iguazú</h3>
              <p>A minutos de una de las maravillas del mundo</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">🏨 Destino Turístico</h3>
              <p>Millones de visitantes anuales</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">🌍 Triple Frontera</h3>
              <p>Argentina, Brasil y Paraguay</p>
            </div>
          </div>
        </div>
      </section>

      {/* Información local */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">¿Por qué invertir en Puerto Iguazú?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold mb-4">🌊 Cataratas del Iguazú</h3>
                <p className="text-gray-700">
                  Ubicado a solo 18 km de las mundialmente famosas Cataratas del Iguazú,
                  declaradas Patrimonio Natural de la Humanidad por la UNESCO.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">✈️ Conectividad Internacional</h3>
                <p className="text-gray-700">
                  Aeropuerto Internacional Cataratas del Iguazú con vuelos directos
                  desde las principales ciudades de Argentina y conexiones internacionales.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🏨 Industria Turística</h3>
                <p className="text-gray-700">
                  Más de 1.5 millones de turistas anuales generan una demanda constante
                  de alojamiento y servicios, ideal para inversiones en turismo.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🌍 Triple Frontera</h3>
                <p className="text-gray-700">
                  Punto estratégico donde confluyen Argentina, Brasil y Paraguay,
                  con oportunidades comerciales únicas en la región.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">🦋 Parque Nacional Iguazú</h3>
                <p className="text-gray-700">
                  Rodeado de selva subtropical y biodiversidad única,
                  ofreciendo un entorno natural incomparable para vivir.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">💰 Rentabilidad Turística</h3>
                <p className="text-gray-700">
                  Excelente potencial de rentabilidad para propiedades destinadas
                  a alquiler turístico y hospedaje temporal.
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
            Propiedades Disponibles en Puerto Iguazú
          </h2>
          <PropertyGrid initialProperties={properties} />
        </div>
      </section>

      {/* Información adicional sobre inversión turística */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Oportunidades de Inversión Turística</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">🏠 Alquiler Turístico</h3>
                <p className="text-gray-700">
                  Propiedades para Airbnb y alquiler temporal con alta demanda
                  durante todo el año.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">🏨 Hospedajes</h3>
                <p className="text-gray-700">
                  Hostels, apart-hoteles y cabañas con excelente retorno
                  de inversión en zona turística.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">🏪 Locales Comerciales</h3>
                <p className="text-gray-700">
                  Espacios comerciales en zonas de alto tránsito turístico
                  para restaurantes y tiendas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD para SEO local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Propiedades en Puerto Iguazú, Misiones",
            "description": "Propiedades en alquiler y venta en Puerto Iguazú, puerta de entrada a las Cataratas del Iguazú",
            "url": "https://misionesarrienda.com.ar/puerto-iguazu",
            "about": {
              "@type": "Place",
              "name": "Puerto Iguazú",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Puerto Iguazú",
                "addressRegion": "Misiones",
                "addressCountry": "AR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -25.5947,
                "longitude": -54.5734
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
