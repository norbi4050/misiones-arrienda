import { Suspense } from 'react'
import { Metadata } from 'next'
import { PropertiesPageClient } from './properties-client'
import { PageTracker } from '@/components/analytics/page-tracker'

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

export default function PropertiesPage() {
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
