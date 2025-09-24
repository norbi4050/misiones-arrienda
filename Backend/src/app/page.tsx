import { HeroSection } from '@/components/hero-section'
import { PropertyGridServer } from '@/components/property-grid-server'
import { fetchRealProperties } from '@/lib/api'
import { PageTracker } from '@/components/analytics/page-tracker'
import { Metadata } from 'next'

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
  // Obtener propiedades destacadas para renderizado inicial
  const initialProperties = await getInitialProperties()

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
