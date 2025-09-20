import { Metadata } from 'next'
import { getProperties } from '@/lib/api'
import { generateCityPageSchema, generateBreadcrumbSchema } from '@/lib/structured-data'
import { PropertyType } from '@/types/property'
import EldoradoClient from '@/components/eldorado/EldoradoClient'

export const metadata: Metadata = {
  title: 'Alquiler en Eldorado, Misiones | Misiones Arrienda',
  description: 'Encuentra las mejores propiedades en alquiler en Eldorado, Misiones. Casas, departamentos y habitaciones compartidas en la ciudad del conocimiento.',
  keywords: 'alquiler Eldorado, propiedades Eldorado, Misiones, inmuebles, casas, departamentos, habitaciones compartidas',
  openGraph: {
    title: 'Propiedades en Alquiler en Eldorado, Misiones',
    description: 'Descubre las mejores opciones de alquiler en Eldorado, la ciudad del conocimiento en Misiones.',
    images: ['/images/cities/eldorado-hero.jpg'],
    type: 'website',
    locale: 'es_AR'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alquiler en Eldorado, Misiones',
    description: 'Encuentra propiedades en alquiler en Eldorado, Misiones',
    images: ['/images/cities/eldorado-hero.jpg']
  }
}

// Si la página depende de query params para render
export const dynamic = 'force-dynamic'

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function EldoradoPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // Normalizar searchParams sin usar useSearchParams()
  const city = (searchParams.city as string) ?? 'Eldorado'
  const type = (searchParams.type as string) ?? ''
  const min = (searchParams.min as string) ?? ''
  const max = (searchParams.max as string) ?? ''
  const bedrooms = (searchParams.bedrooms as string) ?? ''
  const bathrooms = (searchParams.bathrooms as string) ?? ''
  const featured = (searchParams.featured as string) ?? ''

  // Mapear type string a PropertyType
  const getPropertyType = (typeStr: string): PropertyType | undefined => {
    const upperType = typeStr.toUpperCase()
    if (upperType === 'HOUSE' || upperType === 'APARTMENT' ||
        upperType === 'COMMERCIAL' || upperType === 'LAND') {
      return upperType as PropertyType
    }
    return undefined
  }

  // Get properties for Eldorado with filters
  const response = await getProperties({
    city: 'Eldorado',
    ...(type && { propertyType: getPropertyType(type) }),
    ...(min && { minPrice: parseInt(min) }),
    ...(max && { maxPrice: parseInt(max) }),
    ...(bedrooms && { minBedrooms: parseInt(bedrooms) }),
    ...(bathrooms && { minBathrooms: parseInt(bathrooms) }),
    ...(featured && { featured: featured === 'true' }),
  })
  const eldoradoProperties = response.properties

  // Generate structured data
  const citySchema = generateCityPageSchema(
    'Eldorado',
    'Ciudad del conocimiento en Misiones, Argentina. Conocida por su desarrollo industrial y educativo.',
    { lat: -26.4, lng: -54.6167 }
  )

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Eldorado', url: '/eldorado' }
  ])

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(citySchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />

      <EldoradoClient
        initial={{ city, type, min, max, bedrooms, bathrooms, featured }}
        initialProperties={eldoradoProperties}
      />
    </>
  )
}
