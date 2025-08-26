import { Suspense } from 'react'
import { Metadata } from 'next'
import { PropertiesPageClient } from './properties-client'

export const metadata: Metadata = {
  title: 'Propiedades en Alquiler y Venta - Misiones | MisionesArrienda',
  description: 'Encuentra la propiedad perfecta en Misiones. Casas, departamentos, locales comerciales y terrenos en alquiler y venta en Posadas, Oberá, Puerto Iguazú y más ciudades.',
  keywords: 'propiedades Misiones, alquiler Posadas, venta casas Oberá, departamentos Puerto Iguazú, inmobiliaria Misiones',
  openGraph: {
    title: 'Propiedades en Misiones - Alquiler y Venta',
    description: 'Explora miles de propiedades en Misiones con filtros avanzados. Encuentra tu hogar ideal.',
    type: 'website',
  }
}

export default function PropertiesPage() {
  return (
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
  )
}
